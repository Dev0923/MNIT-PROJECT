import re
import sys

with open('src/app/components/BookingFlowModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update props
content = content.replace(
    'interface BookingFlowModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  property: AccommodationProperty;\n}',
    'interface BookingFlowModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  property: AccommodationProperty;\n  checkInDate: string;\n  checkOutDate: string;\n}'
)
content = content.replace(
    'export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({ isOpen, onClose, property }) => {',
    'export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({ isOpen, onClose, property, checkInDate, checkOutDate }) => {'
)

# 2. Update STEPS array
old_steps = """const STEPS = [
  { id: 1, name: 'Dates', icon: Calendar },
  { id: 2, name: 'Room', icon: Home },
  { id: 3, name: 'Guest Info', icon: Users },
  { id: 4, name: 'Verification', icon: IdCard },
  { id: 5, name: 'Pilgrimage', icon: ShieldCheck },
  { id: 6, name: 'Emergency', icon: PhoneCall },
  { id: 7, name: 'Payment', icon: CreditCard },
  { id: 8, name: 'Success', icon: CheckCircle },
];"""
new_steps = """const STEPS = [
  { id: 1, name: 'Room', icon: Home },
  { id: 2, name: 'Guest Info', icon: Users },
  { id: 3, name: 'Verification', icon: IdCard },
  { id: 4, name: 'Pilgrimage', icon: ShieldCheck },
  { id: 5, name: 'Emergency', icon: PhoneCall },
  { id: 6, name: 'Payment', icon: CreditCard },
  { id: 7, name: 'Success', icon: CheckCircle },
];"""
content = content.replace(old_steps, new_steps)

# 3. Update useEffect
old_use_effect = """      // Set tomorrow as default checkin, day after as checkout
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);

      setFormData({
        check_in: tomorrow.toISOString().split('T')[0],
        check_out: dayAfter.toISOString().split('T')[0],"""
new_use_effect = """      setFormData({
        check_in: checkInDate,
        check_out: checkOutDate,"""
content = content.replace(old_use_effect, new_use_effect)
content = content.replace("darshan_date: tomorrow.toISOString().split('T')[0],", "darshan_date: checkInDate,")

# 4. Fix validation
# We completely delete the `if (step === 1) { ... }` logic.
old_val_step_1 = """    if (step === 1) {
      if (!formData.check_in) stepErrors.check_in = 'Check-in date is required';
      if (!formData.check_out) stepErrors.check_out = 'Check-out date is required';
      if (formData.check_in && formData.check_out) {
        const checkinDate = new Date(formData.check_in);
        const checkoutDate = new Date(formData.check_out);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (checkinDate < today) {
          stepErrors.check_in = 'Check-in cannot be in the past';
        }
        if (checkoutDate <= checkinDate) {
          stepErrors.check_out = 'Check-out must be after check-in';
        }
      }
      if (formData.adults < 1) stepErrors.adults = 'At least 1 adult is required';
    } 
    
    else if (step === 2) {"""
new_val_step_1 = "    if (step === 1) {"
content = content.replace(old_val_step_1, new_val_step_1)

# Now step indices are off by 1 in validateStep
content = content.replace("else if (step === 3) {", "else if (step === 2) {")
content = content.replace("else if (step === 4) {", "else if (step === 3) {")
content = content.replace("else if (step === 5) {", "else if (step === 4) {")
content = content.replace("else if (step === 6) {", "else if (step === 5) {")

# 5. Fix UI step render logic
# Find block from {currentStep === 1 && ( ... )} down to the end of it (just before {currentStep === 2 && ()
# A simple regex won't work well because of nested divs.
# I'll just use string find to cut it out.
start_idx = content.find("{currentStep === 1 && (")
if start_idx != -1:
    end_idx = content.find("{currentStep === 2 && (", start_idx)
    if end_idx != -1:
        # We also need to remove the leading spaces and newlines if we want it perfectly clean, but replacing the slice is fine.
        content = content[:start_idx] + content[end_idx:]

# Now decrement currentStep checks
content = content.replace("{currentStep === 2 && (", "{currentStep === 1 && (")
content = content.replace("{currentStep === 3 && (", "{currentStep === 2 && (")
content = content.replace("{currentStep === 4 && (", "{currentStep === 3 && (")
content = content.replace("{currentStep === 5 && (", "{currentStep === 4 && (")
content = content.replace("{currentStep === 6 && (", "{currentStep === 5 && (")
content = content.replace("{currentStep === 7 && (", "{currentStep === 6 && (")
content = content.replace("{currentStep === 8 && bookingResult && (", "{currentStep === 7 && bookingResult && (")

# 6. Fix `currentStep === 8` comparisons elsewhere
content = content.replace("currentStep === 8", "currentStep === 7")
content = content.replace("STEPS.length", "7")

# There's a 'Next Step' button checking if it's the last step. It uses STEPS.length, which is now 7.

with open('src/app/components/BookingFlowModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
