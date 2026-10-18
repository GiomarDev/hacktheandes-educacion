-- Límite de intentos de login por IP: cuenta los fallos recientes de una IP.
CREATE INDEX "auth_events_ip_occurred_at_idx" ON "auth_events"("ip", "occurred_at");
