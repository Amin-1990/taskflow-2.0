/**
 * Hook usePermissions
 * Expose canRead(module) et canWrite(module) à partir des permissions de l'utilisateur connecté.
 *
 * Exemple :
 *   const { canRead, canWrite } = usePermissions();
 *   canRead('COMMANDES')  // true si COMMANDES_READ est dans la liste
 *   canWrite('COMMANDES') // true si COMMANDES_WRITE est dans la liste
 */
import { useAuth } from './useAuth';

export const usePermissions = () => {
    const { user } = useAuth();
    const permissions: string[] = user?.permissions ?? [];

    const canRead = (module: string): boolean =>
        permissions.includes(`${module}_READ`);

    const canWrite = (module: string): boolean =>
        permissions.includes(`${module}_WRITE`);

    return { canRead, canWrite };
};

export default usePermissions;
