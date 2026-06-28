from datetime import datetime, timezone, timedelta
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.sql_models import (
    User, DarshanSlot, AccommodationProperty, AccommodationRoom,
    SupportQuery, LostItem, FoundItem, CrowdDensityLog,
    GeneralPermission, Vehicle, VehiclePermission
)
from utils.jwt_handler import get_optional_current_user
from services.llm_client import llm_client
from ai.service import AIService

logger = logging.getLogger("chatbot")

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])

# In-memory dictionary for conversational session state
# Structure: { session_id: { "state": str, "history": List[Dict], "ticket_data": Dict, "language": str } }
chatbot_sessions: Dict[str, Dict[str, Any]] = {}

class ChatbotRequest(BaseModel):
    message: str = Field(..., description="User's query or reply")
    quick_action: Optional[str] = Field(None, description="Optional quick action keyword")
    session_id: str = Field(..., description="Conversation session ID")
    language: str = Field("en", description="Language: 'en' (English) or 'hi' (Hindi)")

class ChatbotResponse(BaseModel):
    reply: str
    session_id: str
    state: str
    show_ticket_buttons: bool = False

# Helper: validate email formatting
def is_valid_email(email: str) -> bool:
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(email_pattern, email.strip()))

# Helper: check user message for SOS/distress signals
def check_sos_keywords(text: str) -> bool:
    keywords = [
        "emergency", "distress", "sos", "accident", "injured", "injury", "medical help",
        "ambulance", "heart attack", "danger", "police help", "fire", "lost child",
        "आपातकालीन", "आपात", "दुर्घटना", "चोट", "एंबुलेंस", "खतरा", "पुलिस सहायता", "खोया बच्चा"
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)

# Database lookup: Check Darshan slots
async def query_darshan_slots(db: AsyncSession, language: str) -> str:
    now = datetime.now(timezone.utc)
    # Query database slots for today and tomorrow
    stmt = select(DarshanSlot).where(DarshanSlot.slot_time >= now.replace(minute=0, second=0, microsecond=0)).order_by(DarshanSlot.slot_time.asc()).limit(10)
    res = await db.execute(stmt)
    slots = res.scalars().all()
    
    if not slots:
        # Generate some virtual slots if database has no slot limits initialized
        return (
            "Darshan slots are open from 06:00 AM to 09:00 PM daily. General slots are available. "
            "Please go to the Darshan Booking tab to book your slot."
            if language == "en" else
            "दर्शन स्लॉट रोजाना सुबह 06:00 बजे से रात 09:00 बजे तक खुले रहते हैं। सामान्य स्लॉट उपलब्ध हैं। "
            "कृपया अपना स्लॉट बुक करने के लिए 'दर्शन बुकिंग' टैब पर जाएं।"
        )
        
    lines = []
    if language == "hi":
        lines.append("🗓️ दर्शन स्लॉट की उपलब्धता:")
        for s in slots:
            time_str = s.slot_time.strftime("%d %b - %H:%M")
            left = s.capacity - s.booked_count
            status_text = "पूर्ण (Full)" if left <= 0 else f"{left} स्थान बाकी"
            lines.append(f"- {time_str}: {status_text}")
    else:
        lines.append("🗓️ Available Darshan Slots (Next 10 Slots):")
        for s in slots:
            time_str = s.slot_time.strftime("%d %b - %I:%M %p")
            left = s.capacity - s.booked_count
            status_text = "Full" if left <= 0 else f"{left} spots left"
            lines.append(f"- {time_str}: {status_text}")
            
    return "\n".join(lines)

# Database lookup: Find accommodation property options
async def query_accommodations(db: AsyncSession, language: str) -> str:
    stmt = select(AccommodationProperty).limit(5)
    res = await db.execute(stmt)
    props = res.scalars().all()
    
    if not props:
        return (
            "Dharamshalas and hotels are available near the temple starting from ₹150. "
            "Please go to the Accommodation booking page to search."
            if language == "en" else
            "मंदिर के पास ₹150 से शुरू होने वाले धर्मशाला और होटल के विकल्प उपलब्ध हैं। "
            "कृपया खोजने के लिए आवास (Accommodation) बुकिंग पृष्ठ पर जाएं।"
        )
        
    lines = []
    if language == "hi":
        lines.append("🏨 मंदिर के पास ठहरने के स्थान (धर्मशाला/होटल):")
        for p in props:
            lines.append(f"- *{p.name}* ({p.type}): दूरी {p.distance} किमी, मूल्य ₹{p.price_start} से शुरू।")
    else:
        lines.append("🏨 Accommodation options near the temple:")
        for p in props:
            lines.append(f"- *{p.name}* ({p.type}): Distance {p.distance} km, starts from ₹{p.price_start}/night.")
            
    return "\n".join(lines)

# Database lookup: Track lost & found items
async def query_lost_found(db: AsyncSession, language: str) -> str:
    stmt = select(FoundItem).where(FoundItem.status == "In Storage").order_by(FoundItem.created_at.desc()).limit(5)
    res = await db.execute(stmt)
    found_items = res.scalars().all()
    
    if language == "hi":
        msg = (
            "🔍 खोया-पाया (Lost & Found) सेवा:\n"
            "यदि आपने मंदिर परिसर में कुछ खो दिया है, तो आप 'Lost & Found' टैब में जाकर रिपोर्ट दर्ज कर सकते हैं।\n\n"
        )
        if found_items:
            msg += "हाल ही में जमा की गई वस्तुएं (भंडारण में):\n"
            for item in found_items:
                msg += f"- {item.category} (स्थान: {item.location_found}, दिनांक: {item.date_found.strftime('%d-%m-%Y')})\n"
        else:
            msg += "वर्तमान में हाल ही की कोई वस्तु भंडार में दर्ज नहीं है।"
    else:
        msg = (
            "🔍 Lost & Found Registry:\n"
            "If you have lost any belongings in the temple area, you can log a missing report in the 'Lost & Found' section.\n\n"
        )
        if found_items:
            msg += "Recently found items currently in storage:\n"
            for item in found_items:
                msg += f"- {item.category} (found at {item.location_found} on {item.date_found.strftime('%d %b')})\n"
        else:
            msg += "Currently no new found items are listed in storage."
            
    return msg

# Live crowd counts
async def query_crowd_density(db: AsyncSession, language: str) -> str:
    # 1. Look up latest CrowdDensityLog
    stmt = select(CrowdDensityLog).distinct(CrowdDensityLog.zone_name).order_by(CrowdDensityLog.zone_name, desc(CrowdDensityLog.recorded_at))
    res = await db.execute(stmt)
    logs = res.scalars().all()
    
    def translate_status(status: str) -> str:
        if language != "hi":
            return status
        mapping = {
            "Normal": "सामान्य",
            "Moderate": "मध्यम",
            "Dense": "घनी भीड़",
            "Critical": "अत्यधिक भीड़"
        }
        return mapping.get(status, status)

    lines = []
    if language == "hi":
        lines.append("👥 मंदिर में भीड़ की लाइव स्थिति:")
        if logs:
            for log in logs:
                lines.append(f"- {log.zone_name}: {translate_status(log.status)}")
        else:
            lines.append("भीड़ का स्तर वर्तमान में सामान्य है।")
    else:
        lines.append("👥 Live Crowd Occupancy in Temple Zones:")
        if logs:
            for log in logs:
                lines.append(f"- {log.zone_name}: {log.status}")
        else:
            lines.append("Crowd occupancy level is currently normal.")
            
    return "\n".join(lines)

# Database lookup: Track permission status
async def query_user_permissions(db: AsyncSession, user: Optional[User], user_msg: str, language: str) -> str:
    # 1. Look for explicit codes in message
    code_match = re.search(r"\b([A-Z]{3}\d{3})\b", user_msg.upper())
    plate_match = re.search(r"\b([A-Z]{2}\d{2}[A-Z]{2}\d{4})\b", user_msg.replace(" ", "").upper())
    
    # Try alternate vehicle plate pattern if needed
    alt_plate = None
    if not plate_match:
        words = user_msg.upper().split()
        for w in words:
            if re.match(r"^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$", w):
                alt_plate = w
                break

    lines = []
    found_any = False

    if code_match:
        code = code_match.group(1)
        stmt = select(GeneralPermission).where(GeneralPermission.permission_code == code)
        res = await db.execute(stmt)
        perm = res.scalar_one_or_none()
        if perm:
            found_any = True
            if language == "hi":
                lines.append(f"🔍 अनुमति विवरण ({code}):")
                lines.append(f"- **आवेदक:** {perm.name}")
                lines.append(f"- **प्रकार:** {perm.type} ({perm.subtype})")
                lines.append(f"- **उद्देश्य:** {perm.purpose}")
                lines.append(f"- **दिनांक:** {perm.date}")
                lines.append(f"- **स्थिति:** **{perm.status}**")
            else:
                lines.append(f"🔍 Permit Details ({code}):")
                lines.append(f"- **Applicant:** {perm.name}")
                lines.append(f"- **Type:** {perm.type} ({perm.subtype})")
                lines.append(f"- **Purpose:** {perm.purpose}")
                lines.append(f"- **Date:** {perm.date}")
                lines.append(f"- **Status:** **{perm.status}**")
        else:
            if language == "hi":
                lines.append(f"❌ मुझे संदर्भ कोड '{code}' के लिए कोई अनुमति रिकॉर्ड नहीं मिला।")
            else:
                lines.append(f"❌ I could not find any permission record for reference code '{code}'.")

    elif plate_match or alt_plate:
        plate = (plate_match.group(1) if plate_match else alt_plate).replace(" ", "").upper()
        stmt_v = select(Vehicle).where(Vehicle.plate_number == plate)
        res_v = await db.execute(stmt_v)
        v = res_v.scalar_one_or_none()
        if v:
            stmt_vp = select(VehiclePermission).where(VehiclePermission.vehicle_id == v.id).order_by(VehiclePermission.created_at.desc())
            res_vp = await db.execute(stmt_vp)
            vps = res_vp.scalars().all()
            found_any = True
            
            if language == "hi":
                lines.append(f"🚗 वाहन अनुमति स्थिति ({plate}):")
                lines.append(f"- **वाहन मॉडल:** {v.model or 'N/A'} ({v.vehicle_type})")
                if vps:
                    for vp in vps:
                        valid_str = f"{vp.valid_from.strftime('%d-%m-%Y')} से {vp.valid_to.strftime('%d-%m-%Y')}"
                        lines.append(f"- **पास प्रकार:** {vp.permit_type}")
                        lines.append(f"- **वैधता:** {valid_str}")
                        lines.append(f"- **स्थिति:** **{vp.status}**")
                else:
                    lines.append("- इस वाहन के लिए कोई सक्रिय परमिट/पास दर्ज नहीं है।")
            else:
                lines.append(f"🚗 Vehicle Permit Status ({plate}):")
                lines.append(f"- **Vehicle Model:** {v.model or 'N/A'} ({v.vehicle_type})")
                if vps:
                    for vp in vps:
                        valid_str = f"from {vp.valid_from.strftime('%d %b %Y')} to {vp.valid_to.strftime('%d %b %Y')}"
                        lines.append(f"- **Pass Type:** {vp.permit_type}")
                        lines.append(f"- **Validity:** {valid_str}")
                        lines.append(f"- **Status:** **{vp.status}**")
                else:
                    lines.append("- No active passes/permits found for this vehicle.")
        else:
            if language == "hi":
                lines.append(f"❌ वाहन संख्या '{plate}' के लिए कोई पंजीकरण रिकॉर्ड नहीं मिला।")
            else:
                lines.append(f"❌ I could not find any vehicle registration record for plate '{plate}'.")

    elif user:
        stmt_gen = select(GeneralPermission).where(GeneralPermission.user_id == user.id).order_by(GeneralPermission.created_at.desc())
        res_gen = await db.execute(stmt_gen)
        gen_perms = res_gen.scalars().all()

        stmt_veh = select(Vehicle).where(Vehicle.owner_id == user.id)
        res_veh = await db.execute(stmt_veh)
        vehicles = res_veh.scalars().all()
        veh_perms_list = []
        for v in vehicles:
            stmt_vp = select(VehiclePermission).where(VehiclePermission.vehicle_id == v.id).order_by(VehiclePermission.created_at.desc())
            res_vp = await db.execute(stmt_vp)
            vps = res_vp.scalars().all()
            for vp in vps:
                veh_perms_list.append((v, vp))

        if gen_perms or veh_perms_list:
            found_any = True
            if language == "hi":
                lines.append(f"📋 आपके पंजीकृत परमिट और अनुमतियाँ ({user.name}):")
                if gen_perms:
                    lines.append("\n**सामान्य सेवा अनुमतियाँ (जैसे भंडारा, मेडिकल कैंप):**")
                    for p in gen_perms:
                        lines.append(f"- {p.type} ({p.permission_code}): **{p.status}** (दिनांक: {p.date})")
                if veh_perms_list:
                    lines.append("\n**वाहन परमिट:**")
                    for v, vp in veh_perms_list:
                        lines.append(f"- {v.plate_number} ({vp.permit_type}): **{vp.status}**")
            else:
                lines.append(f"📋 Your Registered Permits & Permissions ({user.name}):")
                if gen_perms:
                    lines.append("\n**General Event/Service Permits:**")
                    for p in gen_perms:
                        lines.append(f"- {p.type} ({p.permission_code}): **{p.status}** (Date: {p.date})")
                if veh_perms_list:
                    lines.append("\n**Vehicle Permits:**")
                    for v, vp in veh_perms_list:
                        lines.append(f"- {v.plate_number} ({vp.permit_type}): **{vp.status}**")
        else:
            if language == "hi":
                lines.append("🤷 आपके खाते से जुड़ी कोई अनुमति या वाहन परमिट नहीं मिला।")
                lines.append("यदि आपके पास एक संदर्भ कोड है, तो कृपया इसे दर्ज करें (जैसे **BAN001** या वाहन संख्या **RJ14AB1234**)।")
            else:
                lines.append("🤷 No filed permissions or vehicle permits found linked to your account.")
                lines.append("If you have a reference code, please type it (e.g. **BAN001** or vehicle plate **RJ14AB1234**) to query.")
                
    else:
        if language == "hi":
            lines.append("🔑 परमिट/अनुमति स्थिति की जांच करने के लिए:")
            lines.append("1. कृपया अपने खाते में लॉगिन करें।")
            lines.append("2. या सीधे अपनी अनुमति संदर्भ संख्या दर्ज करें (जैसे **BAN001**, **MED001**) या वाहन संख्या (जैसे **RJ14AB1234**)।")
        else:
            lines.append("🔑 To check permission or vehicle permit status:")
            lines.append("1. Please log in to your account.")
            lines.append("2. Or type your permission reference code (e.g. **BAN001**, **MED001**) or vehicle plate number (e.g. **RJ14AB1234**).")

    return "\n".join(lines)


# GROUNDING CONTEXT builder for LLM
async def build_grounding_context(db: AsyncSession, user: Optional[User] = None) -> str:
    # Quick snapshots of live data
    # 1. Weather info
    weather_desc = "Clear, 24°C"
    # 2. Crowd density
    stmt_crowd = select(CrowdDensityLog).distinct(CrowdDensityLog.zone_name).order_by(CrowdDensityLog.zone_name, desc(CrowdDensityLog.recorded_at)).limit(3)
    res_crowd = await db.execute(stmt_crowd)
    crowds = res_crowd.scalars().all()
    crowd_text = ", ".join([f"{c.zone_name}: {c.current_count} ({c.status})" for c in crowds]) if crowds else "Normal"
    
    # 3. Available properties
    stmt_prop = select(AccommodationProperty).limit(2)
    res_prop = await db.execute(stmt_prop)
    props = res_prop.scalars().all()
    accomm_text = ", ".join([f"{p.name} (starting ₹{p.price_start})" for p in props]) if props else "Shree Shyam Trust"

    # 4. User permissions
    user_perm_text = "None found"
    if user:
        # Get general
        stmt_gen = select(GeneralPermission).where(GeneralPermission.user_id == user.id)
        res_gen = await db.execute(stmt_gen)
        gen_perms = res_gen.scalars().all()
        gen_list = [f"{g.type} permit ({g.permission_code}): status {g.status}" for g in gen_perms]

        # Get vehicles
        stmt_veh = select(Vehicle).where(Vehicle.owner_id == user.id)
        res_veh = await db.execute(stmt_veh)
        vehicles = res_veh.scalars().all()
        veh_list = []
        for v in vehicles:
            stmt_vp = select(VehiclePermission).where(VehiclePermission.vehicle_id == v.id)
            res_vp = await db.execute(stmt_vp)
            vps = res_vp.scalars().all()
            for vp in vps:
                veh_list.append(f"Vehicle {v.plate_number} permit ({vp.permit_type}): status {vp.status}")
        
        combined_list = gen_list + veh_list
        if combined_list:
            user_perm_text = "; ".join(combined_list)
    
    context = (
        f"Grounding Temple Portal Context:\n"
        f"- Current Temple Time: {datetime.now(timezone.utc).strftime('%H:%M UTC')}\n"
        f"- Weather in Khatu Shyam Ji: {weather_desc}\n"
        f"- Live Crowd occupancy levels: {crowd_text}\n"
        f"- Accommodation near temple: {accomm_text}\n"
        f"- Devotee's Submitted Permits/Permissions: {user_perm_text}\n"
        f"- Help Desk Phone: +91-1576-230182\n"
        f"- Annadaan Seva, Bhandara permissions, Medical camp requests, and Vehicle registration entry are supported on the site."
    )
    return context

def query_donation_help(language: str) -> str:
    if language == "hi":
        return (
            "🙏 मंदिर दान सेवा:\n"
            "आप मंदिर के विभिन्न कल्याणकारी कार्यों के लिए दान कर सकते हैं, जैसे अन्नदान (भोजन वितरण)।\n\n"
            "1. **अन्नदान सेवा:** सेवा पोर्टल के अंतर्गत मुफ्त प्रसाद भोजन के वितरण के लिए समर्पित बुकिंग खुली हैं।\n"
            "2. **80G कर छूट:** ₹500 या उससे अधिक के सभी दान के लिए उपलब्ध है। चेकआउट के दौरान आपको एक वैध पैन कार्ड प्रदान करना होगा।\n\n"
            "दान करने के लिए, शीर्ष नेविगेशन बार से 'दान (Donation)' पोर्टल पर जाएं।"
        )
    else:
        return (
            "🙏 Temple Donation Seva:\n"
            "You can contribute to various temple welfare activities including Annadaan (food distribution).\n\n"
            "1. **Annadaan Seva:** Dedicated bookings for distribution of free prasad meals are open under the Seva portal.\n"
            "2. **80G Tax Exemption:** Available for all donations of ₹500 or more. You must provide a valid PAN card during checkout.\n\n"
            "To make a donation, navigate to the 'Donation' portal from the top navigation bar."
        )


@router.post("/message", response_model=ChatbotResponse)
async def chat_message(
    request: ChatbotRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    session_id = request.session_id
    user_msg = request.message.strip()
    language = request.language
    quick_action = request.quick_action

    # Initialize session if not present
    if session_id not in chatbot_sessions:
        chatbot_sessions[session_id] = {
            "state": "NORMAL",
            "history": [],
            "ticket_data": {},
            "language": language
        }

    session = chatbot_sessions[session_id]
    session["language"] = language  # Keep language preference synchronized

    # SOS Distress Scan
    if check_sos_keywords(user_msg):
        sos_reply = (
            "🚨 **EMERGENCY DETECTED / आपातकालीन सूचना** 🚨\n\n"
            "If you or someone near you requires immediate medical or security assistance, "
            "please click the **RED [SOS Alert] BUTTON** in the bottom-left/top corner of the website. "
            "This will instantly log your location coordinates and alert the temple rescue team.\n\n"
            "यदि आपको या आपके किसी करीबी को आपातकालीन सहायता की आवश्यकता है, तो कृपया तुरंत वेबसाइट पर "
            "मौजूद **लाल [SOS Alert] बटन** को दबाएं। इससे आपका स्थान दर्ज हो जाएगा और हमारी टीम सहायता के लिए पहुंचेगी।"
        )
        return ChatbotResponse(reply=sos_reply, session_id=session_id, state="NORMAL")

    # A. Ticket creation cancel command check
    if user_msg.lower() in ["cancel", "radd", "रद्द करें", "रद्द"]:
        if session["state"] != "NORMAL":
            session["state"] = "NORMAL"
            session["ticket_data"] = {}
            cancel_reply = (
                "Ticket creation process has been cancelled. How else can I help you?"
                if language == "en" else
                "टिकट बनाने की प्रक्रिया रद्द कर दी गई है। मैं आपकी और क्या मदद कर सकता हूँ?"
            )
            return ChatbotResponse(reply=cancel_reply, session_id=session_id, state="NORMAL")

    # B. Support Ticket State Machine
    current_state = session["state"]

    if current_state == "AWAITING_TICKET_CONFIRMATION":
        yes_regex = r"\b(yes|yeah|y|haan|yes please|हाँ|हा)\b"
        if re.search(yes_regex, user_msg.lower()):
            # Fill details if user is logged in
            if current_user:
                session["ticket_data"]["name"] = current_user.name or f"User_{current_user.id}"
                session["ticket_data"]["email"] = current_user.email or ""
            else:
                session["ticket_data"]["name"] = None
                session["ticket_data"]["email"] = None
                
            session["ticket_data"]["subject"] = None
            session["ticket_data"]["message"] = None

            # Move state forward
            if not session["ticket_data"]["name"]:
                session["state"] = "COLLECTING_NAME"
                reply = (
                    "Please enter your full name:\n(Type 'cancel' to exit)"
                    if language == "en" else
                    "कृपया अपना पूरा नाम दर्ज करें:\n(रद्द करने के लिए 'cancel' लिखें)"
                )
            elif not session["ticket_data"]["email"]:
                session["state"] = "COLLECTING_EMAIL"
                reply = (
                    "Please enter your email address:\n(Type 'cancel' to exit)"
                    if language == "en" else
                    "कृपया अपना ईमेल पता दर्ज करें:\n(रद्द करने के लिए 'cancel' लिखें)"
                )
            else:
                session["state"] = "COLLECTING_SUBJECT"
                reply = (
                    "What is the subject of your ticket?\n(Type 'cancel' to exit)"
                    if language == "en" else
                    "आपके टिकट का विषय (Subject) क्या है?\n(रद्द करने के लिए 'cancel' लिखें)"
                )
            return ChatbotResponse(reply=reply, session_id=session_id, state=session["state"])
        else:
            session["state"] = "NORMAL"
            reply = (
                "Understood. We will not raise a ticket. How can I help you?"
                if language == "en" else
                "समझ गया। हम टिकट दर्ज नहीं करेंगे। मैं आपकी क्या सहायता कर सकता हूँ?"
            )
            return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")

    elif current_state == "COLLECTING_NAME":
        session["ticket_data"]["name"] = user_msg
        session["state"] = "COLLECTING_EMAIL"
        reply = (
            "Please enter your email address:\n(Type 'cancel' to exit)"
            if language == "en" else
            "कृपया अपना ईमेल पता दर्ज करें:\n(रद्द करने के लिए 'cancel' लिखें)"
        )
        return ChatbotResponse(reply=reply, session_id=session_id, state="COLLECTING_EMAIL")

    elif current_state == "COLLECTING_EMAIL":
        if not is_valid_email(user_msg):
            reply = (
                "Please enter a valid email address (e.g. user@example.com):\n(Type 'cancel' to exit)"
                if language == "en" else
                "कृपया एक वैध ईमेल पता दर्ज करें (जैसे user@example.com):\n(रद्द करने के लिए 'cancel' लिखें)"
            )
            return ChatbotResponse(reply=reply, session_id=session_id, state="COLLECTING_EMAIL")
        
        session["ticket_data"]["email"] = user_msg
        session["state"] = "COLLECTING_SUBJECT"
        reply = (
            "What is the subject of your ticket?\n(Type 'cancel' to exit)"
            if language == "en" else
            "आपके टिकट का विषय क्या है?\n(रद्द करने के लिए 'cancel' लिखें)"
        )
        return ChatbotResponse(reply=reply, session_id=session_id, state="COLLECTING_SUBJECT")

    elif current_state == "COLLECTING_SUBJECT":
        session["ticket_data"]["subject"] = user_msg
        session["state"] = "COLLECTING_MESSAGE"
        reply = (
            "Please describe your support query in detail:\n(Type 'cancel' to exit)"
            if language == "en" else
            "कृपया अपनी समस्या का विवरण विस्तार से लिखें:\n(रद्द करने के लिए 'cancel' लिखें)"
        )
        return ChatbotResponse(reply=reply, session_id=session_id, state="COLLECTING_MESSAGE")

    elif current_state == "COLLECTING_MESSAGE":
        session["ticket_data"]["message"] = user_msg
        session["state"] = "CONFIRMING_TICKET_DETAILS"
        
        data = session["ticket_data"]
        reply = (
            f"Please confirm the details of your support ticket:\n\n"
            f"- **Name:** {data['name']}\n"
            f"- **Email:** {data['email']}\n"
            f"- **Subject:** {data['subject']}\n"
            f"- **Query:** {data['message']}\n\n"
            f"Do you confirm these details? (Yes / No)"
            if language == "en" else
            f"कृपया अपने सहायता टिकट के विवरण की पुष्टि करें:\n\n"
            f"- **नाम:** {data['name']}\n"
            f"- **ईमेल:** {data['email']}\n"
            f"- **विषय:** {data['subject']}\n"
            f"- **विवरण:** {data['message']}\n\n"
            f"क्या आप इन विवरणों की पुष्टि करते हैं? (हाँ / नहीं)"
        )
        return ChatbotResponse(reply=reply, session_id=session_id, state="CONFIRMING_TICKET_DETAILS", show_ticket_buttons=True)

    elif current_state == "CONFIRMING_TICKET_DETAILS":
        yes_regex = r"\b(yes|yeah|y|confirm|ok|haan|हाँ|हा)\b"
        if re.search(yes_regex, user_msg.lower()):
            data = session["ticket_data"]
            # Save to Database
            ticket = SupportQuery(
                name=data["name"],
                email=data["email"],
                subject=data["subject"],
                message=data["message"],
                status="open",
                created_at=datetime.now(timezone.utc)
            )
            db.add(ticket)
            await db.commit()
            await db.refresh(ticket)
            
            ref_id = f"REF-{ticket.id}"
            
            session["state"] = "NORMAL"
            session["ticket_data"] = {}
            
            reply = (
                f"Your support ticket has been created successfully! **Reference ID: {ref_id}**.\n"
                f"Our support team will follow up with you via email shortly."
                if language == "en" else
                f"आपका सहायता टिकट सफलतापूर्वक दर्ज कर लिया गया है! **संदर्भ आईडी (Reference ID): {ref_id}**।\n"
                f"हमारी सहायता टीम जल्द ही ईमेल के माध्यम से आपसे संपर्क करेगी।"
            )
            return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")
        else:
            session["state"] = "NORMAL"
            session["ticket_data"] = {}
            reply = (
                "Ticket creation cancelled. How else can I assist you today?"
                if language == "en" else
                "टिकट निर्माण रद्द कर दिया गया है। मैं आपकी और क्या मदद कर सकता हूँ?"
            )
            return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")

    # C. Handle Quick Actions (direct DB lookups)
    action_type = quick_action or user_msg
    
    # Standardize string matches for buttons
    action_key = action_type.strip().lower()
    
    if "slots" in action_key or "स्लॉट" in action_key or action_key == "check_slots":
        reply = await query_darshan_slots(db, language)
        return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")
        
    elif "accommodation" in action_key or "ठहरने" in action_key or "hotel" in action_key or action_key == "find_accommodation":
        reply = await query_accommodations(db, language)
        return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")
        
    elif "donation" in action_key or "दान" in action_key or action_key == "donation_help":
        reply = query_donation_help(language)
        return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")
        
    elif "lost" in action_key or "खोया" in action_key or action_key == "track_lost":
        reply = await query_lost_found(db, language)
        return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")
        
    elif "crowded" in action_key or "भीड़" in action_key or action_key == "check_crowd":
        reply = await query_crowd_density(db, language)
        return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")

    elif (
        action_key == "check_permissions" or
        # Reference codes e.g. BAN001, MED001
        re.search(r"\b([A-Z]{3}\d{3})\b", user_msg.upper()) or
        # Plate numbers e.g. RJ14AB1234
        re.search(r"\b([A-Z]{2}\d{2}[A-Z]{2}\d{4})\b", user_msg.replace(" ", "").upper()) or
        # Alternate plate numbers e.g. RJ14A1234
        any(re.match(r"^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$", w) for w in user_msg.upper().split()) or
        # Or explicit checks for status/my permits
        "my permit" in action_key or
        "my permission" in action_key or
        "my pass" in action_key or
        "check my" in action_key or
        "status" in action_key or
        "status" in user_msg.lower() or
        "स्थिति" in action_key or
        "मेरी अनुमति" in action_key or
        "मेरा पास" in action_key
    ):
        reply = await query_user_permissions(db, current_user, user_msg, language)
        return ChatbotResponse(reply=reply, session_id=session_id, state="NORMAL")

    # D. Ground conversational prompt and forward to LLM
    # Grounding context
    grounding_info = await build_grounding_context(db, current_user)
    
    system_instruction = (
        "You are 'Shyam Sevak', the official AI chatbot of the Khatu Shyam Ji Temple. "
        "Your mission is to help devotees with bookings, general info, weather, accommodation, and crowd updates. "
        "Keep your replies concise, warm, helpful, and highly respectful.\n\n"
        "GROUNDING DATA (use this facts grounded directly from the live temple database):\n"
        f"{grounding_info}\n\n"
        "RULES:\n"
        "1. Do not hallucinate or guess capacities, slot numbers or prices if they are not in the grounding data.\n"
        "2. If the user query is about booking slots, accommodation, donations, or lost items, briefly mention they can use the quick action buttons or corresponding tabs.\n"
        "3. IMPORTANT: If you cannot solve a problem or the user seems highly frustrated or directly asks to talk to a human, "
        "your response MUST start with the trigger prefix '[ESCALATE]' followed by a message asking them if they would like you to raise a support ticket. Example: '[ESCALATE] I am sorry I cannot solve this issue. Would you like me to raise a support ticket so our team can follow up with you?'\n"
        "4. Keep conversation memory in mind and reply in the user's language (Hindi if they talk in Hindi, English if in English)."
    )

    # Convert session history to Gemini schema:
    # {"role": "user"|"model", "parts": [{"text": str}]}
    gemini_history = []
    for h in session["history"][-12:]: # Last 12 messages context
        gemini_history.append({
            "role": "user" if h["role"] == "user" else "model",
            "parts": [{"text": h["text"]}]
        })
        
    # Append current message
    gemini_history.append({
        "role": "user",
        "parts": [{"text": user_msg}]
    })

    # Call Gemini API
    llm_reply = await llm_client.generate_response(gemini_history, system_instruction)
    
    # Scan for ESCALATE tag in LLM response
    show_ticket_buttons = False
    if llm_reply.startswith("[ESCALATE]"):
        llm_reply = llm_reply.replace("[ESCALATE]", "").strip()
        session["state"] = "AWAITING_TICKET_CONFIRMATION"
        show_ticket_buttons = True

    # Record in history
    session["history"].append({"role": "user", "text": user_msg})
    session["history"].append({"role": "model", "text": llm_reply})

    return ChatbotResponse(
        reply=llm_reply,
        session_id=session_id,
        state=session["state"],
        show_ticket_buttons=show_ticket_buttons
    )
