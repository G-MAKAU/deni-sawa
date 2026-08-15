-- ────────────────────────────────────────────────────────────────────────────
-- Deni Sawa Partners — Business Financial Health Check™
-- Replaces the previous Business Health Check question bank with the full
-- 10-section, 44-question assessment (profile, cash flow & debt, operations &
-- sustainability, business sustainability, marketing & growth, technology & AI,
-- resilience, founder wellbeing, open reflection, report selection).
--
-- Run the ENTIRE file as a single transaction (Supabase SQL Editor).
-- ────────────────────────────────────────────────────────────────────────────

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Update the catalog entry + delete the OLD business check content
--    (sections cascade to subsections → questions → options).
-- ════════════════════════════════════════════════════════════════════════════
update public.health_checks
set name               = 'Business Financial Health Check™',
    description        = 'For Entrepreneurs, Founders, SMEs and Business Owners. This assessment is confidential and helps establish your business baseline across finance, marketing, technology and sustainability.' || E'\n\n' ||
                         'By submitting this form, I consent to Deni Sawa Partners collecting and using my information for assessment, mentorship, and support purposes. My information will be treated confidentially and used in accordance with applicable data protection requirements.',
    estimated_minutes  = 20,
    tags               = array['Finance','Marketing','Technology','Sustainability','Resilience'],
    updated_at         = now()
where slug = 'business-health-check';

delete from public.health_check_sections
where health_check_id = (select id from public.health_checks where slug = 'business-health-check');

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Rebuild sections → subsections → questions → options.
--    Sections have a fixed sort_order (sec_ord) which the question rows reuse
--    to attach each question to the right subsection. Options map back to their
--    question by unique question_text.
-- ════════════════════════════════════════════════════════════════════════════
with chk as (
  select id from public.health_checks where slug = 'business-health-check'
),
sec as (
  insert into public.health_check_sections (health_check_id, title, sort_order)
  select chk.id, s.title, s.ord
  from chk,
  (values
    ('Your Business Profile',                1),
    ('Section A: Cash Flow & Debt',          2),
    ('Section B: Operations & Sustainability', 3),
    ('Business Sustainability',              4),
    ('Section C: Marketing & Customer Growth', 5),
    ('Section D: Technology, AI & Digital Tools', 6),
    ('Section E: Resilience & Emergency Readiness', 7),
    ('Section F: Founder Wellbeing',         8),
    ('Open Reflection',                      9),
    ('Report Selection',                    10)
  ) as s(title, ord)
  returning id, sort_order, title
),
sub as (
  insert into public.health_check_subsections (section_id, heading, sort_order)
  select sec.id, sec.title, 1
  from sec
  returning id, section_id
),
sec_map as (
  select sec.sort_order, sec.id as section_id, sub.id as subsection_id
  from sec
  join sub on sub.section_id = sec.id
),
q as (
  insert into public.health_check_questions
    (subsection_id, question_text, question_type, is_required, helper_text, sort_order)
  select sm.subsection_id, qq.text, qq.qtype, qq.required, qq.helper::text, qq.ord
  from sec_map sm
  join (values
    -- ── Section 1: Your Business Profile ────────────────────────────────
    (1,  1, 'Your full name', 'paragraph', true,  null),
    (1,  2, 'Business name', 'paragraph', true,  null),
    (1,  3, 'Email address', 'paragraph', true,  null),
    (1,  4, 'WhatsApp number', 'paragraph', false, null),
    (1,  5, 'How would you describe your business?', 'single_select', true, null),
    (1,  6, 'What industry are you in?', 'paragraph', false, null),
    (1,  7, 'How long has your business been operating?', 'single_select', true, null),
    (1,  8, 'Approximate monthly business revenue (KES)?', 'single_select', true, null),
    -- ── Section 2: Cash Flow & Debt ─────────────────────────────────────
    (2,  1, 'How would you describe your business revenue over the last 3 months?', 'single_select', true, null),
    (2,  2, 'At the end of most months, your business cash position is:', 'single_select', true, null),
    (2,  3, 'Does your business currently have outstanding loans or credit obligations?', 'single_select', true, null),
    (2,  4, 'How much of your monthly revenue goes to debt repayments?', 'single_select', true, null),
    (2,  5, 'Rate the overall health of your business cash flow right now.', 'single_select', true, '1 = Critical · 5 = Strong'),
    -- ── Section 3: Operations & Sustainability ──────────────────────────
    (3,  1, 'How dependent is the business on you personally to function day-to-day?', 'single_select', true, null),
    (3,  2, 'Are you able to pay staff (if any) and suppliers on time?', 'single_select', true, null),
    (3,  3, 'Does your business have any of the following? (Select all that apply)', 'multi_select', true, null),
    -- ── Section 4: Business Sustainability ──────────────────────────────
    (4,  1, 'How would you describe your current customer base?', 'single_select', true, null),
    (4,  2, 'Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'single_select', true, null),
    (4,  3, 'How conscious is your business about environmental and social impact?', 'single_select', true, null),
    (4,  4, 'What sustainability practices does your business currently have? (Select all that apply)', 'multi_select', true, null),
    (4,  5, 'Rate how sustainable and resilient your current business model feels right now.', 'single_select', true, '1 = Collapsing · 5 = Built to last'),
    -- ── Section 5: Marketing & Customer Growth ──────────────────────────
    (5,  1, 'How do most of your new customers find you?', 'single_select', true, null),
    (5,  2, 'Does your business have a defined marketing strategy or plan?', 'single_select', true, null),
    (5,  3, 'Which marketing channels does your business actively use? (Select all that apply)', 'multi_select', true, null),
    (5,  4, 'Do you have a system to follow up with leads or past customers?', 'single_select', true, null),
    (5,  5, 'Can you clearly articulate what makes your business different from competitors?', 'single_select', true, null),
    (5,  6, 'Rate the effectiveness of your current marketing and customer growth efforts.', 'single_select', true, '1 = Non-existent · 5 = Strong'),
    -- ── Section 6: Technology, AI & Digital Tools ───────────────────────
    (6,  1, 'How would you describe your business''s overall use of digital technology?', 'single_select', true, null),
    (6,  2, 'Which of these digital tools does your business currently use? (Select all that apply)', 'multi_select', true, null),
    (6,  3, 'Does your business have a professional online presence? (Select all that apply)', 'multi_select', true, null),
    (6,  4, 'Are you currently using any AI-powered tools in your business?', 'single_select', true, null),
    (6,  5, 'Which AI or automation tools have you used or are open to using? (Select all that apply)', 'multi_select', true, null),
    (6,  6, 'What is the main barrier to using more technology in your business?', 'single_select', true, null),
    (6,  7, 'Rate how digitally equipped and future-ready your business is right now.', 'single_select', true, '1 = Not at all · 5 = Future-ready'),
    -- ── Section 7: Resilience & Emergency Readiness ─────────────────────
    (7,  1, 'If your business had zero revenue for 30 days, could it survive?', 'single_select', true, null),
    (7,  2, 'Has your business experienced a significant financial shock in the last 12 months?', 'single_select', true, null),
    (7,  3, 'Rate your business''s overall resilience to disruption right now.', 'single_select', true, '1 = Very fragile · 5 = Very resilient'),
    -- ── Section 8: Founder Wellbeing ────────────────────────────────────
    (8,  1, 'How are you personally coping with the pressures of running this business?', 'single_select', true, null),
    (8,  2, 'Is business stress affecting your personal life (family, health, relationships)?', 'single_select', true, null),
    (8,  3, 'Rate your personal motivation and clarity about the way forward for your business.', 'single_select', true, '1 = Lost / hopeless · 5 = Clear & driven'),
    -- ── Section 9: Open Reflection ──────────────────────────────────────
    (9,  1, 'What is the single most urgent challenge your business faces right now?', 'paragraph', false, null),
    (9,  2, 'What kind of support would be most valuable to you at this stage? (Select all that apply)', 'multi_select', true, null),
    (9,  3, 'Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'single_select', true, null),
    -- ── Section 10: Report Selection ────────────────────────────────────
    (10, 1, 'Please select your preferred option:', 'single_select', true, 'Choose the report or programme you would like.')
  ) as qq(sec_ord, ord, text, qtype, required, helper)
    on qq.sec_ord = sm.sort_order
  returning id, question_text
)
insert into public.health_check_question_options (question_id, option_text, sort_order)
select q.id, o.text, o.ord
from q
join (values
  -- Q5
  ('How would you describe your business?', 'Sole trader / One-person business', 1),
  ('How would you describe your business?', 'Startup (less than 2 years old)', 2),
  ('How would you describe your business?', 'Small business (2-10 employees)', 3),
  ('How would you describe your business?', 'Social enterprise / NGO', 4),
  ('How would you describe your business?', 'Medium business (11-50 employees)', 5),
  ('How would you describe your business?', 'Other', 6),
  -- Q7
  ('How long has your business been operating?', 'Less than 1 year', 1),
  ('How long has your business been operating?', '1-2 years', 2),
  ('How long has your business been operating?', '3-5 years', 3),
  ('How long has your business been operating?', '6-10 years', 4),
  ('How long has your business been operating?', 'Over 10 years', 5),
  -- Q8
  ('Approximate monthly business revenue (KES)?', 'Below 50,000', 1),
  ('Approximate monthly business revenue (KES)?', '50,000-200,000', 2),
  ('Approximate monthly business revenue (KES)?', '200,001-500,000', 3),
  ('Approximate monthly business revenue (KES)?', '500,001-1,000,000', 4),
  ('Approximate monthly business revenue (KES)?', 'Above 1,000,000', 5),
  ('Approximate monthly business revenue (KES)?', 'Revenue is irregular / hard to estimate', 6),
  -- Q9
  ('How would you describe your business revenue over the last 3 months?', 'Growing consistently', 1),
  ('How would you describe your business revenue over the last 3 months?', 'Stable but flat', 2),
  ('How would you describe your business revenue over the last 3 months?', 'Declining', 3),
  ('How would you describe your business revenue over the last 3 months?', 'Very unpredictable - up and down', 4),
  ('How would you describe your business revenue over the last 3 months?', 'We have barely been making sales', 5),
  -- Q10
  ('At the end of most months, your business cash position is:', 'In surplus - we have money left over', 1),
  ('At the end of most months, your business cash position is:', 'Break-even - revenue just covers costs', 2),
  ('At the end of most months, your business cash position is:', 'In deficit - costs regularly exceed revenue', 3),
  ('At the end of most months, your business cash position is:', 'We rely on credit or loans to stay operational', 4),
  -- Q11
  ('Does your business currently have outstanding loans or credit obligations?', 'No debt at all', 1),
  ('Does your business currently have outstanding loans or credit obligations?', 'Yes - manageable, payments are up to date', 2),
  ('Does your business currently have outstanding loans or credit obligations?', 'Yes - struggling to keep up with repayments', 3),
  ('Does your business currently have outstanding loans or credit obligations?', 'Yes - in arrears or defaulting on some obligations', 4),
  -- Q12
  ('How much of your monthly revenue goes to debt repayments?', 'Nothing - no debt', 1),
  ('How much of your monthly revenue goes to debt repayments?', 'Less than 20%', 2),
  ('How much of your monthly revenue goes to debt repayments?', '20-40%', 3),
  ('How much of your monthly revenue goes to debt repayments?', '41-60%', 4),
  ('How much of your monthly revenue goes to debt repayments?', 'Over 60% - it is suffocating the business', 5),
  -- Q13
  ('Rate the overall health of your business cash flow right now.', '1', 1),
  ('Rate the overall health of your business cash flow right now.', '2', 2),
  ('Rate the overall health of your business cash flow right now.', '3', 3),
  ('Rate the overall health of your business cash flow right now.', '4', 4),
  ('Rate the overall health of your business cash flow right now.', '5', 5),
  -- Q14
  ('How dependent is the business on you personally to function day-to-day?', 'Fully dependent - it stops when I stop', 1),
  ('How dependent is the business on you personally to function day-to-day?', 'Mostly dependent - I handle most things', 2),
  ('How dependent is the business on you personally to function day-to-day?', 'Somewhat - key roles are shared', 3),
  ('How dependent is the business on you personally to function day-to-day?', 'Mostly independent - strong team and systems in place', 4),
  -- Q15
  ('Are you able to pay staff (if any) and suppliers on time?', 'Yes - always on time', 1),
  ('Are you able to pay staff (if any) and suppliers on time?', 'Usually - with occasional delays', 2),
  ('Are you able to pay staff (if any) and suppliers on time?', 'Often delayed - it causes tension', 3),
  ('Are you able to pay staff (if any) and suppliers on time?', 'No - we are behind on payroll or supplier payments', 4),
  ('Are you able to pay staff (if any) and suppliers on time?', 'No employees or suppliers', 5),
  -- Q16
  ('Does your business have any of the following? (Select all that apply)', 'Separate business bank account', 1),
  ('Does your business have any of the following? (Select all that apply)', 'Business insurance', 2),
  ('Does your business have any of the following? (Select all that apply)', 'Basic bookkeeping or accounting records', 3),
  ('Does your business have any of the following? (Select all that apply)', 'A written business plan or strategy', 4),
  ('Does your business have any of the following? (Select all that apply)', 'A defined pricing structure', 5),
  ('Does your business have any of the following? (Select all that apply)', 'Written contracts with clients or suppliers', 6),
  ('Does your business have any of the following? (Select all that apply)', 'None of the above', 7),
  -- Q17
  ('How would you describe your current customer base?', 'One or two major clients - very concentrated risk', 1),
  ('How would you describe your current customer base?', 'A few regular clients with occasional new ones', 2),
  ('How would you describe your current customer base?', 'A healthy mix of loyal and new customers', 3),
  ('How would you describe your current customer base?', 'Largely transactional - we chase new customers constantly', 4),
  -- Q18
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'Yes - a significant portion of revenue is recurring', 1),
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'Yes - but it is a small portion', 2),
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'No - most revenue is once-off or project-based', 3),
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'Not yet, but I am working towards it', 4),
  -- Q19
  ('How conscious is your business about environmental and social impact?', 'We actively measure and reduce our environmental footprint', 1),
  ('How conscious is your business about environmental and social impact?', 'We are aware but have not yet taken formal steps', 2),
  ('How conscious is your business about environmental and social impact?', 'It is not currently a focus', 3),
  ('How conscious is your business about environmental and social impact?', 'We are interested but do not know where to start', 4),
  -- Q20
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Waste reduction or recycling practices', 1),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Community investment or social programmes', 2),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Ethical sourcing or supplier standards', 3),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Energy efficiency measures', 4),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Fair employment and staff welfare policies', 5),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'None currently', 6),
  -- Q21
  ('Rate how sustainable and resilient your current business model feels right now.', '1', 1),
  ('Rate how sustainable and resilient your current business model feels right now.', '2', 2),
  ('Rate how sustainable and resilient your current business model feels right now.', '3', 3),
  ('Rate how sustainable and resilient your current business model feels right now.', '4', 4),
  ('Rate how sustainable and resilient your current business model feels right now.', '5', 5),
  -- Q22
  ('How do most of your new customers find you?', 'Word of mouth / referrals', 1),
  ('How do most of your new customers find you?', 'Networking and events', 2),
  ('How do most of your new customers find you?', 'Social media (organic)', 3),
  ('How do most of your new customers find you?', 'Walk-in / physical presence', 4),
  ('How do most of your new customers find you?', 'Paid advertising (online or offline)', 5),
  ('How do most of your new customers find you?', 'We do not have a clear customer acquisition channel', 6),
  -- Q23
  ('Does your business have a defined marketing strategy or plan?', 'Yes - written, active and working', 1),
  ('Does your business have a defined marketing strategy or plan?', 'Yes - but it is not consistently followed', 2),
  ('Does your business have a defined marketing strategy or plan?', 'Informal - we market reactively when needed', 3),
  ('Does your business have a defined marketing strategy or plan?', 'No marketing strategy at all', 4),
  -- Q24
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Facebook / Instagram', 1),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Email marketing', 2),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'WhatsApp Business', 3),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'SMS / bulk messaging', 4),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'LinkedIn', 5),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Radio / TV / print advertising', 6),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'TikTok', 7),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Flyers and physical marketing', 8),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Google My Business / SEO', 9),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'None currently active', 10),
  -- Q25
  ('Do you have a system to follow up with leads or past customers?', 'Yes - automated or structured follow-up process', 1),
  ('Do you have a system to follow up with leads or past customers?', 'Yes - but it is manual and inconsistent', 2),
  ('Do you have a system to follow up with leads or past customers?', 'Occasionally - when we remember', 3),
  ('Do you have a system to follow up with leads or past customers?', 'No - we do not follow up', 4),
  -- Q26
  ('Can you clearly articulate what makes your business different from competitors?', 'Yes - our value proposition is clear and compelling', 1),
  ('Can you clearly articulate what makes your business different from competitors?', 'Somewhat - we have a sense of it but struggle to communicate it', 2),
  ('Can you clearly articulate what makes your business different from competitors?', 'Not really - we compete mostly on price', 3),
  ('Can you clearly articulate what makes your business different from competitors?', 'No - we have not defined our differentiation', 4),
  -- Q27
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '1', 1),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '2', 2),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '3', 3),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '4', 4),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '5', 5),
  -- Q28
  ('How would you describe your business''s overall use of digital technology?', 'Advanced - we rely heavily on digital tools and systems', 1),
  ('How would you describe your business''s overall use of digital technology?', 'Moderate - we use some digital tools but not consistently', 2),
  ('How would you describe your business''s overall use of digital technology?', 'Basic - we use mainly phones and WhatsApp', 3),
  ('How would you describe your business''s overall use of digital technology?', 'Minimal - most operations are manual or paper-based', 4),
  -- Q29
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Accounting / bookkeeping software', 1),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Payroll software', 2),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Point of Sale (POS) system', 3),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Google Workspace or Microsoft 365', 4),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Customer Relationship Management (CRM) tool', 5),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'E-commerce platform or online store', 6),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Project or task management tool', 7),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Payment platforms (M-Pesa, Stripe, Pesalink etc.)', 8),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Inventory management software', 9),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'None of the above', 10),
  -- Q30
  ('Does your business have a professional online presence? (Select all that apply)', 'Website', 1),
  ('Does your business have a professional online presence? (Select all that apply)', 'LinkedIn company page', 2),
  ('Does your business have a professional online presence? (Select all that apply)', 'Active Facebook or Instagram business page', 3),
  ('Does your business have a professional online presence? (Select all that apply)', 'Online shop or marketplace listing', 4),
  ('Does your business have a professional online presence? (Select all that apply)', 'Google My Business listing', 5),
  ('Does your business have a professional online presence? (Select all that apply)', 'None - we rely on WhatsApp and word of mouth', 6),
  -- Q31
  ('Are you currently using any AI-powered tools in your business?', 'Yes - regularly across multiple areas', 1),
  ('Are you currently using any AI-powered tools in your business?', 'Yes - occasionally for one or two tasks', 2),
  ('Are you currently using any AI-powered tools in your business?', 'I have tried a few but not consistently', 3),
  ('Are you currently using any AI-powered tools in your business?', 'No - I have not used AI tools yet', 4),
  ('Are you currently using any AI-powered tools in your business?', 'I am not sure what AI tools are available', 5),
  -- Q32
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'ChatGPT, Claude or Gemini', 1),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI for accounting or financial reporting', 2),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI image or design tools', 3),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI-assisted market research', 4),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI-powered customer service or chatbots', 5),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI translation or language tools', 6),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'Automated email or social media scheduling', 7),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'None - I am not yet using AI tools', 8),
  -- Q33
  ('What is the main barrier to using more technology in your business?', 'Cost - tools are too expensive', 1),
  ('What is the main barrier to using more technology in your business?', 'Skills - I do not know how to use them', 2),
  ('What is the main barrier to using more technology in your business?', 'Time - I do not have time to learn', 3),
  ('What is the main barrier to using more technology in your business?', 'Awareness - I am not sure what tools are available', 4),
  ('What is the main barrier to using more technology in your business?', 'No barrier - I am already using technology effectively', 5),
  -- Q34
  ('Rate how digitally equipped and future-ready your business is right now.', '1', 1),
  ('Rate how digitally equipped and future-ready your business is right now.', '2', 2),
  ('Rate how digitally equipped and future-ready your business is right now.', '3', 3),
  ('Rate how digitally equipped and future-ready your business is right now.', '4', 4),
  ('Rate how digitally equipped and future-ready your business is right now.', '5', 5),
  -- Q35
  ('If your business had zero revenue for 30 days, could it survive?', 'Yes - we have reserves to cover over 60 days', 1),
  ('If your business had zero revenue for 30 days, could it survive?', 'Maybe - we would survive 30 days with difficulty', 2),
  ('If your business had zero revenue for 30 days, could it survive?', 'Unlikely - we would need to borrow within 2 weeks', 3),
  ('If your business had zero revenue for 30 days, could it survive?', 'No - we would collapse within days', 4),
  -- Q36
  ('Has your business experienced a significant financial shock in the last 12 months?', 'No', 1),
  ('Has your business experienced a significant financial shock in the last 12 months?', 'Yes - minor, we recovered quickly', 2),
  ('Has your business experienced a significant financial shock in the last 12 months?', 'Yes - significant, we are still recovering', 3),
  ('Has your business experienced a significant financial shock in the last 12 months?', 'Yes - severe, it is the reason we are here', 4),
  -- Q37
  ('Rate your business''s overall resilience to disruption right now.', '1', 1),
  ('Rate your business''s overall resilience to disruption right now.', '2', 2),
  ('Rate your business''s overall resilience to disruption right now.', '3', 3),
  ('Rate your business''s overall resilience to disruption right now.', '4', 4),
  ('Rate your business''s overall resilience to disruption right now.', '5', 5),
  -- Q38
  ('How are you personally coping with the pressures of running this business?', 'Well - I feel in control and clear-headed', 1),
  ('How are you personally coping with the pressures of running this business?', 'Managing - some stress but I am holding it together', 2),
  ('How are you personally coping with the pressures of running this business?', 'Struggling - the pressure is affecting me significantly', 3),
  ('How are you personally coping with the pressures of running this business?', 'Overwhelmed - I feel burnt out or close to giving up', 4),
  -- Q39
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Not really', 1),
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Slightly', 2),
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Noticeably', 3),
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Significantly', 4),
  -- Q40
  ('Rate your personal motivation and clarity about the way forward for your business.', '1', 1),
  ('Rate your personal motivation and clarity about the way forward for your business.', '2', 2),
  ('Rate your personal motivation and clarity about the way forward for your business.', '3', 3),
  ('Rate your personal motivation and clarity about the way forward for your business.', '4', 4),
  ('Rate your personal motivation and clarity about the way forward for your business.', '5', 5),
  -- Q42
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Cash flow restructuring', 1),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Access to funding or credit', 2),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Debt negotiation or rescheduling', 3),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Cost reduction plan', 4),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Marketing strategy and customer growth', 5),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Financial management training', 6),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Digital tools setup and training', 7),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Sustainability planning', 8),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'AI tools for my business', 9),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Just having someone to talk to who understands', 10),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Business recovery roadmap', 11),
  -- Q43
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'Yes - WhatsApp preferred', 1),
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'Yes - phone call preferred', 2),
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'Yes - email preferred', 3),
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'No - I will reach out when ready', 4),
  -- Q44
  ('Please select your preferred option:', 'FREE Summary Report', 1),
  ('Please select your preferred option:', 'Detailed Business Analysis Report – KES 2,500', 2),
  ('Please select your preferred option:', 'Detailed Analysis Report + 1-Hour Business Clarity Call – KES 5,000', 3),
  ('Please select your preferred option:', 'Join the Deni Sawa Business Mentorship Program', 4),
  ('Please select your preferred option:', 'None of the Above', 5)
) as o(qtext, text, ord)
  on o.qtext = q.question_text;

commit;
