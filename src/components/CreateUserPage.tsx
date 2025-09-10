"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Login error:', data.message);
        return;
      }

      // Verificar si el usuario es admin consultando la tabla users
      try {
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.role === 'admin') {
            console.log('Storing admin token:', data.session.access_token);
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('adminToken', data.session.access_token);
          } else {
            console.error('Usuario no tiene permisos de administrador');
            return;
          }
        } else {
          console.error('Error al verificar usuario');
          return;
        }
      } catch (error) {
        console.error('Error al verificar rol de usuario:', error);
        return;
      }

      router.push("/dashboard");
      
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-6xl font-bold text-black mb-8">
          Padel Managers
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="w-64">
        <input 
          type="email" 
          placeholder="Email" 
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />
        <button 
          type="submit"
          className="w-full px-6 py-3 text-base bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-300 shadow-lg"
        >
          Login
        </button>
      </form>
    </div>
  );
}
