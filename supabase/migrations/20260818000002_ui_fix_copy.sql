-- System-wide UI copy fixes: remove AI-referencing brand language from
-- live health check descriptions (see system-wide-ui-fix.md).
-- Migrations are additive; these UPDATEs refresh already-seeded rows.

update public.health_checks
set description = 'A structured assessment of your business across Financial Health, Operations, Governance, Cashflow and Growth Readiness. Your responses are analysed and a structured report is prepared, which our advisors use as the foundation for your first conversation.'
where name = 'Business Health Check';

update public.health_checks
set description = 'A structured assessment of your personal financial position across income, debt, cashflow, savings, resilience and future security.'
where name = 'Professional Financial Health Check';