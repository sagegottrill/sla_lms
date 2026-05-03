import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, getUserPermissions, type PermissionKey, type CustomRole, type Permission } from "@/lib/permissions";
import { toast } from "sonner";

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(requiredPermission: PermissionKey): boolean {
  const { appUser } = useAuth();
  
  const { data: customPermissions = [] } = useQuery({
    queryKey: ["user_permissions", appUser?.id],
    queryFn: async () => {
      if (!appUser?.id) return [];
      
      const { data, error } = await supabase
        .rpc("get_user_permissions", { p_user_id: appUser.id });
      
      if (error) {
        console.error("Error fetching user permissions:", error);
        return [];
      }
      
      return (data || []).map((p: any) => p.permission_key as PermissionKey);
    },
    enabled: !!appUser?.id,
  });
  
  if (!appUser) return false;
  
  return hasPermission(appUser.role, customPermissions, requiredPermission);
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions() {
  const { appUser } = useAuth();
  
  return useQuery({
    queryKey: ["user_permissions", appUser?.id],
    queryFn: async () => {
      if (!appUser?.id) return [];
      
      const { data, error } = await supabase
        .rpc("get_user_permissions", { p_user_id: appUser.id });
      
      if (error) {
        console.error("Error fetching user permissions:", error);
        return getUserPermissions(appUser.role);
      }
      
      return (data || []).map((p: any) => p.permission_key as PermissionKey);
    },
    enabled: !!appUser?.id,
  });
}

/**
 * Hook to fetch all available permissions
 */
export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Permission[];
    },
  });
}

/**
 * Hook to fetch all custom roles
 */
export function useCustomRoles() {
  return useQuery<CustomRole[]>({
    queryKey: ["custom_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as CustomRole[];
    },
  });
}

/**
 * Hook to create a custom role
 */
export function useCreateCustomRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roleData: {
      name: string;
      base_role: string;
      description?: string;
      permissions: PermissionKey[];
    }) => {
      const { data, error } = await supabase
        .from("custom_roles")
        .insert({
          ...roleData,
          permissions: roleData.permissions,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      toast.success("Custom role created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create custom role");
    },
  });
}

/**
 * Hook to update a custom role
 */
export function useUpdateCustomRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      roleId,
      updates,
    }: {
      roleId: string;
      updates: Partial<CustomRole>;
    }) => {
      const { data, error } = await supabase
        .from("custom_roles")
        .update(updates)
        .eq("id", roleId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      toast.success("Custom role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update custom role");
    },
  });
}

/**
 * Hook to delete a custom role
 */
export function useDeleteCustomRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      toast.success("Custom role deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete custom role");
    },
  });
}

/**
 * Hook to assign custom role to user
 */
export function useAssignCustomRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      customRoleId,
    }: {
      userId: string;
      customRoleId: string;
    }) => {
      const { data, error } = await supabase
        .from("user_custom_roles")
        .insert({
          user_id: userId,
          custom_role_id: customRoleId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
      toast.success("Custom role assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign custom role");
    },
  });
}

/**
 * Hook to remove custom role from user
 */
export function useRemoveCustomRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      customRoleId,
    }: {
      userId: string;
      customRoleId: string;
    }) => {
      const { error } = await supabase
        .from("user_custom_roles")
        .delete()
        .eq("user_id", userId)
        .eq("custom_role_id", customRoleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
      toast.success("Custom role removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove custom role");
    },
  });
}

/**
 * Hook to get user's custom roles
 */
export function useUserCustomRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["user_custom_roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_custom_roles")
        .select("*, custom_roles(*)")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
