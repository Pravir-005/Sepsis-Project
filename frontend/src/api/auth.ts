import client from './client';

export interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        id: string;
        username: string;
        name: string;
        role: string;
        department: string;
    };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await client.post<LoginResponse>('/auth/login', { username, password });
    return data;
}

export interface SignupPayload {
    username: string;
    password: string;
    confirmPassword: string;
    name: string;
    role: 'doctor' | 'nurse' | 'admin';
    department: string;
}

export async function signup(payload: SignupPayload): Promise<LoginResponse> {
    const { data } = await client.post<LoginResponse>('/auth/signup', payload);
    return data;
}

export async function getMe() {
    const { data } = await client.get('/auth/me');
    return data.user;
}

export async function logout() {
    await client.post('/auth/logout');
    localStorage.removeItem('sepsis_token');
    localStorage.removeItem('sepsis_user');
}
