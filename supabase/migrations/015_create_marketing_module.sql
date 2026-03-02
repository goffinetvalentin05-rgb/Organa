-- ============================================
-- MIGRATION : Module Campagnes marketing
-- ============================================
-- Cette migration crée :
-- 1) marketing_contacts (base contacts par club)
-- 2) marketing_campaigns (historique des campagnes)
-- 3) marketing_campaign_recipients (destinataires + token de désinscription)
-- 4) triggers updated_at + RLS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1) Contacts marketing par club
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  email_normalized TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'unknown',
  source_id TEXT,
  unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_contacts_club_email_unique
  ON public.marketing_contacts (club_id, email_normalized);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_club_created
  ON public.marketing_contacts (club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_club_source
  ON public.marketing_contacts (club_id, source);

-- ============================================
-- 2) Campagnes marketing
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_club_created
  ON public.marketing_campaigns (club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_club_status
  ON public.marketing_campaigns (club_id, status);

-- ============================================
-- 3) Destinataires de campagne (logs + token)
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped_unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_recipients_unsubscribe_token
  ON public.marketing_campaign_recipients (unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_marketing_recipients_campaign
  ON public.marketing_campaign_recipients (campaign_id);

CREATE INDEX IF NOT EXISTS idx_marketing_recipients_club_email
  ON public.marketing_campaign_recipients (club_id, email);

-- ============================================
-- 4) Trigger updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marketing_contacts_updated_at ON public.marketing_contacts;
CREATE TRIGGER update_marketing_contacts_updated_at
  BEFORE UPDATE ON public.marketing_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON public.marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5) RLS
-- ============================================
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Contacts
DROP POLICY IF EXISTS "Users can view their own marketing contacts" ON public.marketing_contacts;
CREATE POLICY "Users can view their own marketing contacts"
  ON public.marketing_contacts FOR SELECT
  USING (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can insert their own marketing contacts" ON public.marketing_contacts;
CREATE POLICY "Users can insert their own marketing contacts"
  ON public.marketing_contacts FOR INSERT
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can update their own marketing contacts" ON public.marketing_contacts;
CREATE POLICY "Users can update their own marketing contacts"
  ON public.marketing_contacts FOR UPDATE
  USING (auth.uid() = club_id)
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can delete their own marketing contacts" ON public.marketing_contacts;
CREATE POLICY "Users can delete their own marketing contacts"
  ON public.marketing_contacts FOR DELETE
  USING (auth.uid() = club_id);

-- Campagnes
DROP POLICY IF EXISTS "Users can view their own marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users can view their own marketing campaigns"
  ON public.marketing_campaigns FOR SELECT
  USING (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can insert their own marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users can insert their own marketing campaigns"
  ON public.marketing_campaigns FOR INSERT
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can update their own marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users can update their own marketing campaigns"
  ON public.marketing_campaigns FOR UPDATE
  USING (auth.uid() = club_id)
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can delete their own marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users can delete their own marketing campaigns"
  ON public.marketing_campaigns FOR DELETE
  USING (auth.uid() = club_id);

-- Destinataires
DROP POLICY IF EXISTS "Users can view their own marketing recipients" ON public.marketing_campaign_recipients;
CREATE POLICY "Users can view their own marketing recipients"
  ON public.marketing_campaign_recipients FOR SELECT
  USING (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can insert their own marketing recipients" ON public.marketing_campaign_recipients;
CREATE POLICY "Users can insert their own marketing recipients"
  ON public.marketing_campaign_recipients FOR INSERT
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can update their own marketing recipients" ON public.marketing_campaign_recipients;
CREATE POLICY "Users can update their own marketing recipients"
  ON public.marketing_campaign_recipients FOR UPDATE
  USING (auth.uid() = club_id)
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can delete their own marketing recipients" ON public.marketing_campaign_recipients;
CREATE POLICY "Users can delete their own marketing recipients"
  ON public.marketing_campaign_recipients FOR DELETE
  USING (auth.uid() = club_id);

SELECT 'Migration 015_create_marketing_module terminée avec succès' AS status;
