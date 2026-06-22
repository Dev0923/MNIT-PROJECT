--
-- PostgreSQL database dump
--

\restrict 33gI2oUCIe0t9qTi5IffHP3fOmnxoexhyuiZjESyeytKJdgk2HF0H3IwJzupBy7

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: logstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.logstatus AS ENUM (
    'SUCCESS',
    'DENIED_EXPIRED',
    'DENIED_INVALID_GATE',
    'DENIED_REVOKED',
    'DUPLICATE_SCAN',
    'BLACKLISTED',
    'OVERRIDE_GRANTED'
);


ALTER TYPE public.logstatus OWNER TO postgres;

--
-- Name: permissionstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.permissionstatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'REVOKED'
);


ALTER TYPE public.permissionstatus OWNER TO postgres;

--
-- Name: purposecategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.purposecategory AS ENUM (
    'VIP',
    'EMERGENCY',
    'STAFF',
    'VENDOR',
    'GENERAL',
    'GOVERNMENT',
    'MEDIA',
    'OTHER'
);


ALTER TYPE public.purposecategory OWNER TO postgres;

--
-- Name: scandirection; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.scandirection AS ENUM (
    'IN',
    'OUT'
);


ALTER TYPE public.scandirection OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'OPERATOR',
    'USER'
);


ALTER TYPE public.userrole OWNER TO postgres;

--
-- Name: vehiclecategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehiclecategory AS ENUM (
    'VIP',
    'EMERGENCY',
    'STAFF',
    'VENDOR',
    'GENERAL'
);


ALTER TYPE public.vehiclecategory OWNER TO postgres;

--
-- Name: vehicletype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehicletype AS ENUM (
    'CAR',
    'BUS',
    'TRUCK',
    'AMBULANCE',
    'MOTORCYCLE',
    'OTHER'
);


ALTER TYPE public.vehicletype OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    old_state jsonb,
    new_state jsonb,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: blacklisted_vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blacklisted_vehicles (
    id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    reason text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blacklisted_vehicles OWNER TO postgres;

--
-- Name: entry_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entry_logs (
    id uuid NOT NULL,
    permission_id uuid,
    gate_id uuid NOT NULL,
    scanned_by uuid NOT NULL,
    scan_time timestamp with time zone DEFAULT now() NOT NULL,
    direction public.scandirection NOT NULL,
    status public.logstatus NOT NULL,
    remarks text,
    override_by uuid,
    override_reason text
);


ALTER TABLE public.entry_logs OWNER TO postgres;

--
-- Name: gates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gates (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    max_vehicles_per_hour integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gates OWNER TO postgres;

--
-- Name: permission_gates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_gates (
    permission_id uuid NOT NULL,
    gate_id uuid NOT NULL
);


ALTER TABLE public.permission_gates OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    permission_code character varying(50) NOT NULL,
    vehicle_id uuid NOT NULL,
    requester_id uuid NOT NULL,
    approved_by uuid,
    status public.permissionstatus DEFAULT 'PENDING'::public.permissionstatus NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    qr_token character varying,
    purpose text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    driver_name character varying(255),
    driver_mobile_number character varying(15),
    driver_license_number character varying(50),
    license_valid_until date,
    time_from time without time zone,
    time_to time without time zone,
    start_point character varying(255),
    end_point character varying(255),
    route_details text,
    purpose_category public.purposecategory,
    expected_occupants integer,
    organization_name character varying(255),
    emergency_contact_name character varying(255),
    emergency_contact_number character varying(15),
    insurance_policy_number character varying(100),
    insurance_valid_until date,
    admin_remarks text,
    rc_url text,
    dl_url text,
    vehicle_photo_url text
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying NOT NULL,
    role public.userrole DEFAULT 'USER'::public.userrole NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    license_plate character varying(20) NOT NULL,
    vehicle_type public.vehicletype NOT NULL,
    vehicle_category public.vehiclecategory NOT NULL,
    owner_name character varying(255) NOT NULL,
    contact_number character varying(15) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
9e0e15eac6c8
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_state, new_state, "timestamp") FROM stdin;
8a999d65-9778-4834-84c2-85a1b9fcb3b3	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-20 16:21:17.560846+05:30
1490d918-f203-4cf2-8537-0ed431eda793	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-20 16:25:41.267292+05:30
1d10fa4c-a3a8-477f-860d-c00112ddf60d	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 21:58:50.403967+05:30
7b083a4d-9f41-45ea-b371-af741a5f3031	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 22:11:40.510729+05:30
7787abce-eb43-4786-8538-5dfecdba3887	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 22:13:19.634461+05:30
4503c2ce-9c64-4b33-9b53-707fd6152d31	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 22:22:52.925005+05:30
8338d4b5-829e-4c0d-9a98-3a9afdd1fa42	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 22:33:17.894775+05:30
ada1c647-353b-4082-9da9-1aa47eee4554	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 22:33:49.086512+05:30
7c5f6ec5-a22c-493a-a070-db893fa1a201	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-21 22:33:53.42617+05:30
0b7cc069-95c6-4791-aa4f-25d8a05caa84	3b42fe8d-682b-44bf-96c4-646e50a964f8	UPDATE_PERMISSION_STATUS	Permission	9aae0636-289f-423c-99ce-00ae0325a737	{"status": "PENDING"}	{"status": "APPROVED", "remarks": "Approved by Super Admin"}	2026-06-21 22:34:19.978543+05:30
2650d700-9599-4754-bdad-1a0f04d21b83	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_FAILURE	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:35:43.222469+05:30
d56b40fe-b480-4928-b097-1b72a85b4244	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_FAILURE	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:35:46.1022+05:30
1dd44fc9-174c-483b-b752-f1601ccca980	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_FAILURE	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:35:50.10819+05:30
8c04a1b0-be62-4d70-a855-73ebfacab79f	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_FAILURE	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:36:04.643577+05:30
f8361b9d-282c-4ffd-8c78-1b31fb8a4406	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_FAILURE	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:36:09.082377+05:30
326906e3-9117-4abe-a240-f6254ce012d2	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:36:48.845112+05:30
fda4b915-4942-4ee5-b0fa-5c08a21bd7d6	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:36:52.601724+05:30
4d4e1522-2f17-40c5-80be-fab0241e7a79	3b42fe8d-682b-44bf-96c4-646e50a964f8	LOGIN_SUCCESS	User	3b42fe8d-682b-44bf-96c4-646e50a964f8	null	null	2026-06-22 09:55:14.524397+05:30
\.


--
-- Data for Name: blacklisted_vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blacklisted_vehicles (id, vehicle_id, reason, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: entry_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entry_logs (id, permission_id, gate_id, scanned_by, scan_time, direction, status, remarks, override_by, override_reason) FROM stdin;
98b63226-f1d4-4e97-b6ff-63088bee6208	9aae0636-289f-423c-99ce-00ae0325a737	d6f3615a-a753-4789-85f9-aef0fb57e84d	3b42fe8d-682b-44bf-96c4-646e50a964f8	2026-06-22 09:40:31.318168+05:30	IN	SUCCESS	\N	\N	\N
\.


--
-- Data for Name: gates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gates (id, name, description, is_active, max_vehicles_per_hour, created_at, updated_at) FROM stdin;
d6f3615a-a753-4789-85f9-aef0fb57e84d	Main VIP Gate	Primary entry point	t	100	2026-06-20 16:32:23.671168+05:30	2026-06-20 16:32:23.671168+05:30
\.


--
-- Data for Name: permission_gates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permission_gates (permission_id, gate_id) FROM stdin;
9aae0636-289f-423c-99ce-00ae0325a737	d6f3615a-a753-4789-85f9-aef0fb57e84d
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, permission_code, vehicle_id, requester_id, approved_by, status, valid_from, valid_until, qr_token, purpose, created_at, updated_at, driver_name, driver_mobile_number, driver_license_number, license_valid_until, time_from, time_to, start_point, end_point, route_details, purpose_category, expected_occupants, organization_name, emergency_contact_name, emergency_contact_number, insurance_policy_number, insurance_valid_until, admin_remarks, rc_url, dl_url, vehicle_photo_url) FROM stdin;
9aae0636-289f-423c-99ce-00ae0325a737	KSJ-2026-GENERAL-3891DE72	5df85bc8-73af-40b7-921a-631353da3a5d	3b42fe8d-682b-44bf-96c4-646e50a964f8	3b42fe8d-682b-44bf-96c4-646e50a964f8	APPROVED	2026-06-21 16:54:00+05:30	2026-06-22 16:54:00+05:30	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YWFlMDYzNi0yODlmLTQyM2MtOTljZS0wMGFlMDMyNWE3MzciLCJqdGkiOiJLU0otMjAyNi1HRU5FUkFMLTM4OTFERTcyIiwiZXhwIjoxNzgyMTI3NDQwfQ.31g6FOJ8YT8r7XUnMwiBvxVeEdKG897zW_vDqsxPOz8	qergvfdsa	2026-06-21 22:24:50.314038+05:30	2026-06-22 09:37:08.138136+05:30	Nikhil Raj Soni	9887155111	KA-03-2010-0012345	2026-06-30	\N	\N	\N	\N	\N	GENERAL	1	\N	\N	\N	1234567890	2026-06-30	Approved by Super Admin	/uploads/permissions\\rc_d90e187b265f4decb268afe53b44469d.pdf	/uploads/permissions\\dl_3771777fa68c437ca879c3470001fd9c.pdf	/uploads/permissions\\photo_b5fa75bb96f84afc8f83ae344c16b27d.png
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, role, is_active, created_at, updated_at) FROM stdin;
3b42fe8d-682b-44bf-96c4-646e50a964f8	superadmin@ksj.com	$2b$12$QVAFGv9PsV3NcKf4RQswzewzxR3SnNGKcQ8KmJeDGQDvMrcRVxjiO	SUPER_ADMIN	t	2026-06-20 16:11:10.815001+05:30	2026-06-20 16:11:10.815001+05:30
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, user_id, license_plate, vehicle_type, vehicle_category, owner_name, contact_number, is_active, created_at, updated_at) FROM stdin;
4af0c8e2-505a-4c09-b60e-92981db0106a	3b42fe8d-682b-44bf-96c4-646e50a964f8	RJ-14NC7684	CAR	GENERAL	nikhil raj soni	9887155111	t	2026-06-21 22:03:23.508804+05:30	2026-06-21 22:03:23.508804+05:30
671894ad-2f2d-4528-b65a-67b1db5e5320	3b42fe8d-682b-44bf-96c4-646e50a964f8	TEST-999	CAR	GENERAL	Test	123	t	2026-06-21 22:12:05.676987+05:30	2026-06-21 22:12:05.676987+05:30
a5ef4ffa-6fc4-452a-a053-09c36532ad4d	3b42fe8d-682b-44bf-96c4-646e50a964f8	TEST-555	CAR	GENERAL	Test	123	t	2026-06-21 22:13:50.335648+05:30	2026-06-21 22:13:50.335648+05:30
5df85bc8-73af-40b7-921a-631353da3a5d	3b42fe8d-682b-44bf-96c4-646e50a964f8	RJ14NC7684	CAR	GENERAL	Nikhil Raj	9887155111	t	2026-06-21 22:24:02.256063+05:30	2026-06-21 22:24:02.256063+05:30
538e75c9-d0ed-4f97-aa18-b6c710188242	3b42fe8d-682b-44bf-96c4-646e50a964f8	RJ14NC7686	CAR	GENERAL	Nikhil Raj	9887155111	t	2026-06-22 09:59:29.052238+05:30	2026-06-22 09:59:29.052238+05:30
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: blacklisted_vehicles blacklisted_vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blacklisted_vehicles
    ADD CONSTRAINT blacklisted_vehicles_pkey PRIMARY KEY (id);


--
-- Name: blacklisted_vehicles blacklisted_vehicles_vehicle_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blacklisted_vehicles
    ADD CONSTRAINT blacklisted_vehicles_vehicle_id_key UNIQUE (vehicle_id);


--
-- Name: entry_logs entry_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entry_logs
    ADD CONSTRAINT entry_logs_pkey PRIMARY KEY (id);


--
-- Name: gates gates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gates
    ADD CONSTRAINT gates_pkey PRIMARY KEY (id);


--
-- Name: permission_gates permission_gates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_gates
    ADD CONSTRAINT permission_gates_pkey PRIMARY KEY (permission_id, gate_id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_qr_token_key UNIQUE (qr_token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_entity_id ON public.audit_logs USING btree (entity_id);


--
-- Name: ix_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_entry_logs_gate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_entry_logs_gate_id ON public.entry_logs USING btree (gate_id);


--
-- Name: ix_entry_logs_permission_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_entry_logs_permission_id ON public.entry_logs USING btree (permission_id);


--
-- Name: ix_entry_logs_scanned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_entry_logs_scanned_by ON public.entry_logs USING btree (scanned_by);


--
-- Name: ix_gates_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_gates_name ON public.gates USING btree (name);


--
-- Name: ix_permissions_permission_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_permissions_permission_code ON public.permissions USING btree (permission_code);


--
-- Name: ix_permissions_requester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_requester_id ON public.permissions USING btree (requester_id);


--
-- Name: ix_permissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_status ON public.permissions USING btree (status);


--
-- Name: ix_permissions_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_vehicle_id ON public.permissions USING btree (vehicle_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_vehicles_license_plate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_vehicles_license_plate ON public.vehicles USING btree (license_plate);


--
-- Name: ix_vehicles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vehicles_user_id ON public.vehicles USING btree (user_id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: blacklisted_vehicles blacklisted_vehicles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blacklisted_vehicles
    ADD CONSTRAINT blacklisted_vehicles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: blacklisted_vehicles blacklisted_vehicles_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blacklisted_vehicles
    ADD CONSTRAINT blacklisted_vehicles_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: entry_logs entry_logs_gate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entry_logs
    ADD CONSTRAINT entry_logs_gate_id_fkey FOREIGN KEY (gate_id) REFERENCES public.gates(id) ON DELETE CASCADE;


--
-- Name: entry_logs entry_logs_override_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entry_logs
    ADD CONSTRAINT entry_logs_override_by_fkey FOREIGN KEY (override_by) REFERENCES public.users(id);


--
-- Name: entry_logs entry_logs_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entry_logs
    ADD CONSTRAINT entry_logs_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE SET NULL;


--
-- Name: entry_logs entry_logs_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entry_logs
    ADD CONSTRAINT entry_logs_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id);


--
-- Name: permission_gates permission_gates_gate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_gates
    ADD CONSTRAINT permission_gates_gate_id_fkey FOREIGN KEY (gate_id) REFERENCES public.gates(id) ON DELETE CASCADE;


--
-- Name: permission_gates permission_gates_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_gates
    ADD CONSTRAINT permission_gates_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: permissions permissions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: permissions permissions_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: permissions permissions_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 33gI2oUCIe0t9qTi5IffHP3fOmnxoexhyuiZjESyeytKJdgk2HF0H3IwJzupBy7

