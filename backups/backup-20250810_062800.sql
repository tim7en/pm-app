--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pmapp_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO pmapp_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pmapp_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BugCategory; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."BugCategory" AS ENUM (
    'UI',
    'FUNCTIONALITY',
    'PERFORMANCE',
    'SECURITY',
    'OTHER'
);


ALTER TYPE public."BugCategory" OWNER TO pmapp_user;

--
-- Name: BugPriority; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."BugPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."BugPriority" OWNER TO pmapp_user;

--
-- Name: BugStatus; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."BugStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'DUPLICATE'
);


ALTER TYPE public."BugStatus" OWNER TO pmapp_user;

--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."ConversationType" AS ENUM (
    'INTERNAL',
    'EXTERNAL'
);


ALTER TYPE public."ConversationType" OWNER TO pmapp_user;

--
-- Name: EventResponse; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."EventResponse" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED'
);


ALTER TYPE public."EventResponse" OWNER TO pmapp_user;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."EventType" AS ENUM (
    'MEETING',
    'CALL',
    'DEADLINE',
    'REMINDER'
);


ALTER TYPE public."EventType" OWNER TO pmapp_user;

--
-- Name: IntegrationType; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."IntegrationType" AS ENUM (
    'TELEGRAM',
    'WHATSAPP'
);


ALTER TYPE public."IntegrationType" OWNER TO pmapp_user;

--
-- Name: InvitationStatus; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."InvitationStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'EXPIRED'
);


ALTER TYPE public."InvitationStatus" OWNER TO pmapp_user;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."NotificationType" AS ENUM (
    'TASK_ASSIGNED',
    'TASK_UPDATED',
    'TASK_COMPLETED',
    'TASK_DUE_SOON',
    'TASK_VERIFICATION_REQUIRED',
    'TASK_VERIFIED',
    'TASK_REJECTED',
    'COMMENT_ADDED',
    'PROJECT_INVITE',
    'WORKSPACE_INVITE',
    'WORKSPACE_REMOVED',
    'ROLE_CHANGE',
    'DEADLINE_APPROACHING',
    'MESSAGE'
);


ALTER TYPE public."NotificationType" OWNER TO pmapp_user;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO pmapp_user;

--
-- Name: ProjectRole; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."ProjectRole" AS ENUM (
    'ADMIN',
    'MANAGER',
    'OFFICER',
    'MEMBER',
    'VIEWER'
);


ALTER TYPE public."ProjectRole" OWNER TO pmapp_user;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE public."ProjectStatus" OWNER TO pmapp_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."Role" AS ENUM (
    'OWNER',
    'ADMIN',
    'PROJECT_MANAGER',
    'PROJECT_OFFICER',
    'MEMBER',
    'GUEST'
);


ALTER TYPE public."Role" OWNER TO pmapp_user;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'AWAITING_VERIFICATION',
    'VERIFIED',
    'DONE',
    'REJECTED'
);


ALTER TYPE public."TaskStatus" OWNER TO pmapp_user;

--
-- Name: TaskVerificationStatus; Type: TYPE; Schema: public; Owner: pmapp_user
--

CREATE TYPE public."TaskVerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public."TaskVerificationStatus" OWNER TO pmapp_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO pmapp_user;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    "userId" text NOT NULL,
    "userName" text NOT NULL,
    "userAvatar" text,
    "clearedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "originalTimestamp" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO pmapp_user;

--
-- Name: bug_reports; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.bug_reports (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority public."BugPriority" DEFAULT 'MEDIUM'::public."BugPriority" NOT NULL,
    category public."BugCategory" DEFAULT 'FUNCTIONALITY'::public."BugCategory" NOT NULL,
    status public."BugStatus" DEFAULT 'OPEN'::public."BugStatus" NOT NULL,
    "stepsToReproduce" text,
    "expectedBehavior" text,
    "actualBehavior" text,
    "browserInfo" text,
    attachments text DEFAULT '[]'::text NOT NULL,
    "reportedBy" text,
    "reportedByName" text DEFAULT 'Anonymous'::text NOT NULL,
    "reportedByEmail" text,
    "assignedTo" text,
    resolution text,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bug_reports OWNER TO pmapp_user;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.calendar_events (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    type public."EventType" NOT NULL,
    location text,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "notificationEnabled" boolean DEFAULT true NOT NULL,
    "creatorId" text NOT NULL,
    "projectId" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.calendar_events OWNER TO pmapp_user;

--
-- Name: comment_attachments; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.comment_attachments (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "commentId" text NOT NULL,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comment_attachments OWNER TO pmapp_user;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.comments (
    id text NOT NULL,
    content text NOT NULL,
    "userId" text NOT NULL,
    "taskId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO pmapp_user;

--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.conversation_participants (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastReadAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversation_participants OWNER TO pmapp_user;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    name text,
    "isGroup" boolean DEFAULT false NOT NULL,
    type public."ConversationType" DEFAULT 'INTERNAL'::public."ConversationType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO pmapp_user;

--
-- Name: event_attendees; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.event_attendees (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "userId" text NOT NULL,
    response public."EventResponse" DEFAULT 'PENDING'::public."EventResponse" NOT NULL
);


ALTER TABLE public.event_attendees OWNER TO pmapp_user;

--
-- Name: integrations; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.integrations (
    id text NOT NULL,
    type public."IntegrationType" NOT NULL,
    config text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.integrations OWNER TO pmapp_user;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.messages (
    id text NOT NULL,
    content text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO pmapp_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type public."NotificationType" NOT NULL,
    "userId" text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO pmapp_user;

--
-- Name: project_members; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.project_members (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text NOT NULL,
    role public."ProjectRole" DEFAULT 'MEMBER'::public."ProjectRole" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_members OWNER TO pmapp_user;

--
-- Name: project_timeline; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.project_timeline (
    id text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.project_timeline OWNER TO pmapp_user;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3b82f6'::text,
    status public."ProjectStatus" DEFAULT 'PLANNING'::public."ProjectStatus" NOT NULL,
    "ownerId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.projects OWNER TO pmapp_user;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.sections (
    id text NOT NULL,
    name text NOT NULL,
    "projectId" text NOT NULL,
    "position" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sections OWNER TO pmapp_user;

--
-- Name: subtasks; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.subtasks (
    id text NOT NULL,
    title text NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "taskId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subtasks OWNER TO pmapp_user;

--
-- Name: task_assignees; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.task_assignees (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "userId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedBy" text
);


ALTER TABLE public.task_assignees OWNER TO pmapp_user;

--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.task_attachments (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "taskId" text NOT NULL,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_attachments OWNER TO pmapp_user;

--
-- Name: task_dependencies; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.task_dependencies (
    id text NOT NULL,
    "precedingTaskId" text NOT NULL,
    "dependentTaskId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_dependencies OWNER TO pmapp_user;

--
-- Name: task_tags; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.task_tags (
    id text NOT NULL,
    name text NOT NULL,
    "taskId" text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL
);


ALTER TABLE public.task_tags OWNER TO pmapp_user;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."TaskStatus" DEFAULT 'TODO'::public."TaskStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "assigneeId" text,
    "creatorId" text NOT NULL,
    "projectId" text NOT NULL,
    "sectionId" text,
    "position" integer DEFAULT 0 NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "verificationStatus" public."TaskVerificationStatus" DEFAULT 'PENDING'::public."TaskVerificationStatus" NOT NULL,
    "verifiedById" text,
    "verifiedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "estimatedHours" double precision,
    "actualHours" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tasks OWNER TO pmapp_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text,
    avatar text,
    role public."Role" DEFAULT 'MEMBER'::public."Role" NOT NULL,
    company text,
    "position" text,
    phone text,
    location text,
    bio text,
    timezone text,
    language text,
    "googleId" text,
    "oauthProvider" text,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "lastLoginAt" timestamp(3) without time zone,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO pmapp_user;

--
-- Name: workspace_invitations; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.workspace_invitations (
    id text NOT NULL,
    email text NOT NULL,
    "workspaceId" text NOT NULL,
    role public."Role" DEFAULT 'MEMBER'::public."Role" NOT NULL,
    "invitedBy" text NOT NULL,
    status public."InvitationStatus" DEFAULT 'PENDING'::public."InvitationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workspace_invitations OWNER TO pmapp_user;

--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.workspace_members (
    id text NOT NULL,
    "userId" text NOT NULL,
    "workspaceId" text NOT NULL,
    role public."Role" DEFAULT 'MEMBER'::public."Role" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    title text,
    department text
);


ALTER TABLE public.workspace_members OWNER TO pmapp_user;

--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: pmapp_user
--

CREATE TABLE public.workspaces (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    avatar text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workspaces OWNER TO pmapp_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c470f615-2280-4e9d-b5a1-01b7142f9f7b	a84fbf69970f4c8b3ef08e7fc25bb94824d4772bb3dd842229375de6c1c59936	2025-08-09 17:02:19.663023+00	20250809170219_init	\N	\N	2025-08-09 17:02:19.607791+00	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.activity_logs (id, type, message, "userId", "userName", "userAvatar", "clearedAt", "originalTimestamp") FROM stdin;
\.


--
-- Data for Name: bug_reports; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.bug_reports (id, title, description, priority, category, status, "stepsToReproduce", "expectedBehavior", "actualBehavior", "browserInfo", attachments, "reportedBy", "reportedByName", "reportedByEmail", "assignedTo", resolution, "resolvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.calendar_events (id, title, description, "startTime", "endTime", type, location, "isRecurring", "notificationEnabled", "creatorId", "projectId", "workspaceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: comment_attachments; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.comment_attachments (id, "fileName", "filePath", "fileSize", "mimeType", "commentId", "uploadedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.comments (id, content, "userId", "taskId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.conversation_participants (id, "conversationId", "userId", "joinedAt", "lastReadAt") FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.conversations (id, name, "isGroup", type, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: event_attendees; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.event_attendees (id, "eventId", "userId", response) FROM stdin;
\.


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.integrations (id, type, config, "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.messages (id, content, "conversationId", "senderId", "isRead", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.notifications (id, title, message, type, "userId", "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.project_members (id, "userId", "projectId", role, "joinedAt") FROM stdin;
\.


--
-- Data for Name: project_timeline; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.project_timeline (id, "projectId", title, description, "startDate", "endDate", color, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.projects (id, name, description, color, status, "ownerId", "workspaceId", "startDate", "dueDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.sections (id, name, "projectId", "position", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: subtasks; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.subtasks (id, title, "isCompleted", "taskId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: task_assignees; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.task_assignees (id, "taskId", "userId", "assignedAt", "assignedBy") FROM stdin;
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.task_attachments (id, "fileName", "filePath", "fileSize", "mimeType", "taskId", "uploadedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: task_dependencies; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.task_dependencies (id, "precedingTaskId", "dependentTaskId", "createdAt") FROM stdin;
\.


--
-- Data for Name: task_tags; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.task_tags (id, name, "taskId", color) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.tasks (id, title, description, status, priority, "dueDate", "assigneeId", "creatorId", "projectId", "sectionId", "position", "completedAt", "verificationStatus", "verifiedById", "verifiedAt", "rejectionReason", "estimatedHours", "actualHours", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.users (id, email, name, password, avatar, role, company, "position", phone, location, bio, timezone, language, "googleId", "oauthProvider", "emailVerified", "resetToken", "resetTokenExpiry", "lastLoginAt", "failedLoginAttempts", "lockedUntil", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.workspace_invitations (id, email, "workspaceId", role, "invitedBy", status, "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: workspace_members; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.workspace_members (id, "userId", "workspaceId", role, "joinedAt", title, department) FROM stdin;
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: pmapp_user
--

COPY public.workspaces (id, name, description, avatar, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: bug_reports bug_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: comment_attachments comment_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: project_timeline project_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.project_timeline
    ADD CONSTRAINT project_timeline_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: subtasks subtasks_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT subtasks_pkey PRIMARY KEY (id);


--
-- Name: task_assignees task_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY (id);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: task_dependencies task_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_pkey PRIMARY KEY (id);


--
-- Name: task_tags task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants_conversationId_userId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON public.conversation_participants USING btree ("conversationId", "userId");


--
-- Name: event_attendees_eventId_userId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "event_attendees_eventId_userId_key" ON public.event_attendees USING btree ("eventId", "userId");


--
-- Name: project_members_userId_projectId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "project_members_userId_projectId_key" ON public.project_members USING btree ("userId", "projectId");


--
-- Name: task_assignees_taskId_userId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "task_assignees_taskId_userId_key" ON public.task_assignees USING btree ("taskId", "userId");


--
-- Name: task_dependencies_precedingTaskId_dependentTaskId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "task_dependencies_precedingTaskId_dependentTaskId_key" ON public.task_dependencies USING btree ("precedingTaskId", "dependentTaskId");


--
-- Name: task_tags_taskId_name_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "task_tags_taskId_name_key" ON public.task_tags USING btree ("taskId", name);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: workspace_invitations_email_workspaceId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "workspace_invitations_email_workspaceId_key" ON public.workspace_invitations USING btree (email, "workspaceId");


--
-- Name: workspace_members_userId_workspaceId_key; Type: INDEX; Schema: public; Owner: pmapp_user
--

CREATE UNIQUE INDEX "workspace_members_userId_workspaceId_key" ON public.workspace_members USING btree ("userId", "workspaceId");


--
-- Name: bug_reports bug_reports_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT "bug_reports_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bug_reports bug_reports_reportedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT "bug_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT "calendar_events_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT "calendar_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT "calendar_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_attachments comment_attachments_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT "comment_attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_attachments comment_attachments_uploadedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT "comment_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_attendees event_attendees_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.calendar_events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_attendees event_attendees_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: integrations integrations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT "integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_members project_members_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_members project_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_timeline project_timeline_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.project_timeline
    ADD CONSTRAINT "project_timeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sections sections_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "sections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subtasks subtasks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT "subtasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_assignedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT "task_assignees_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_assignees task_assignees_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT "task_assignees_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT "task_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_uploadedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT "task_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_dependentTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "task_dependencies_dependentTaskId_fkey" FOREIGN KEY ("dependentTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_precedingTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "task_dependencies_precedingTaskId_fkey" FOREIGN KEY ("precedingTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_tags task_tags_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT "task_tags_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_sectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES public.sections(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workspace_invitations workspace_invitations_invitedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT "workspace_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_invitations workspace_invitations_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pmapp_user
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pmapp_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

