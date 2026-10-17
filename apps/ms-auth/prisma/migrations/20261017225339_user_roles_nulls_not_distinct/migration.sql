-- El alcance (school_id, ugel_id, dre_id) tiene nulos: sin NULLS NOT DISTINCT
-- PostgreSQL permitiría el mismo rol repetido para un usuario.
DROP INDEX "user_roles_user_id_role_school_id_ugel_id_dre_id_key";
CREATE UNIQUE INDEX "user_roles_user_id_role_school_id_ugel_id_dre_id_key" ON "user_roles"("user_id", "role", "school_id", "ugel_id", "dre_id") NULLS NOT DISTINCT;
