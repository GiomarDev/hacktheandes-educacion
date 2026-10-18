-- Recorrido de bienvenida del frontend: roles que ya lo completaron.
ALTER TABLE "users" ADD COLUMN "onboarded_roles" "Role"[] NOT NULL DEFAULT ARRAY[]::"Role"[];
