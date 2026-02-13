import { client } from "./client";

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  roles: Role[];
}

export interface UserCreate {
  username: string;
  email: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
}

export const userService = {
  getUsers: async () => {
    const { data } = await client.get<User[]>("users/");
    return data;
  },
  createUser: async (user: UserCreate) => {
    const { data } = await client.post<User>("users/", user);
    return data;
  },
  updateUser: async (id: number, user: Partial<UserCreate>) => {
    const { data } = await client.put<User>(`users/${id}`, user);
    return data;
  },
  getRoles: async () => {
    const { data } = await client.get<Role[]>("users/roles");
    return data;
  },
  assignRole: async (userId: number, roleId: number) => {
    await client.post(`users/${userId}/roles/${roleId}`);
  },
  removeRole: async (userId: number, roleId: number) => {
    await client.delete(`users/${userId}/roles/${roleId}`);
  },
  deleteUser: async (id: number) => {
    await client.delete(`users/${id}`);
  },
};
