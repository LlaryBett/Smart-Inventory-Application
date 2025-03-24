// import { useContext, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthContext from "../context/AuthContext";
// import signupImage from "../assets/signup.jpg";
// import logoImage from "../assets/logo.png";
// import { toast } from 'react-toastify';

// function Home() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     adminCode: "",
//     rememberMe: false,
//   });
//   const [isRegister, setIsRegister] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const authContext = useContext(AuthContext);
//   const navigate = useNavigate();

//   const handleInputChange = (e) => {
//     const { name, type, value, checked } = e.target;
//     setForm({
//       ...form,
//       [name]: type === "checkbox" ? checked : value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (isRegister) {
//       // Admin registration with secure validation
//       try {
//         if (!form.adminCode) {
//           toast.error("Admin security code is required");
//           return;
//         }

//         validatePassword(form.password);

//         const response = await fetch("http://localhost:5000/api/register", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             name: form.name,
//             email: form.email,
//             password: form.password,
//             role: "admin",
//             adminCode: form.adminCode
//           }),
//         });

//         const data = await response.json();
//         if (!response.ok) {
//           throw new Error(data.message || "Registration failed");
//         }

//         toast.success("Admin account created successfully!");
//         setIsRegister(false);
//       } catch (error) {
//         toast.error(error.message);
//       }
//     } else {
//       // Regular login
//       try {
//         const response = await fetch("http://localhost:5000/api/login", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             email: form.email,
//             password: form.password
//           }),
//         });

//         const data = await response.json();
//         if (!response.ok) {
//           throw new Error(data.message || "Invalid credentials");
//         }

//         if (form.rememberMe) {
//           localStorage.setItem("token", data.token);
//         }

//         authContext.signin(data.token, data.role, () => {
//           if (data.isFirstLogin) {
//             navigate("/change-password");
//             return;
//           }

//           switch (data.role) {
//             case "admin":
//               navigate("/dashboard");
//               break;
//             case "cashier-in":
//               navigate("/stock");
//               break;
//             case "cashier-out":
//               navigate("/sales");
//               break;
//             default:
//               navigate("/dashboard");
//           }
//         });

//         toast.success("Successfully logged in!");
//       } catch (error) {
//         toast.error(error.message);
//       }
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 h-screen items-center place-items-center">
//       <div className="flex justify-center">
//         <img src={signupImage} alt="Sign Up" />
//       </div>
//       <div className="w-full max-w-md space-y-8 p-10 rounded-lg">
//         <div className="text-center">
//           <img className="mx-auto h-12 w-auto" src={logoImage} alt="Your Company" />
//           <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
//             {isRegister ? "Create Admin Account" : "Sign in to your account"}
//           </h2>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="space-y-4">
//             {isRegister && (
//               <>
//                 <div>
//                   <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
//                   <input
//                     id="name"
//                     name="name"
//                     type="text"
//                     required
//                     className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
//                     value={form.name}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">Admin Security Code</label>
//                   <input
//                     id="adminCode"
//                     name="adminCode"
//                     type="password"
//                     required
//                     className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
//                     value={form.adminCode}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//               </>
//             )}
            
//             <div>
//               <label htmlFor="email" className="sr-only">Email address</label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 required
//                 className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
//                 placeholder="Email address"
//                 value={form.email}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <div>
//               <label htmlFor="password" className="sr-only">Password</label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 autoComplete="current-password"
//                 required
//                 className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
//                 placeholder="Password"
//                 value={form.password}
//                 onChange={handleInputChange}
//               />
//             </div>

//             {isRegister && (
//               <div>
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
//                 <input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type="password"
//                   required
//                   className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
//                   value={form.confirmPassword}
//                   onChange={handleInputChange}
//                 />
//               </div>
//             )}

//             {!isRegister && (
//               <div className="flex items-center">
//                 <input
//                   id="rememberMe"
//                   name="rememberMe"
//                   type="checkbox"
//                   className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                   checked={form.rememberMe}
//                   onChange={handleInputChange}
//                 />
//                 <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
//                   Remember me
//                 </label>
//               </div>
//             )}
//           </div>

//           <button
//             type="submit"
//             className="w-full rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600"
//           >
//             {isRegister ? "Register Admin Account" : "Sign in"}
//           </button>
//         </form>

//         {!isRegister && (
//           <p className="mt-4 text-center text-sm text-gray-600">
//             Are you an admin? {" "}
//             <button 
//               onClick={() => setIsRegister(true)} 
//               className="font-medium text-indigo-600 hover:text-indigo-500"
//             >
//               Register here
//             </button>
//           </p>
//         )}

//         {isRegister && (
//           <p className="mt-4 text-center text-sm text-gray-600">
//             Already have an account? {" "}
//             <button 
//               onClick={() => setIsRegister(false)} 
//               className="font-medium text-indigo-600 hover:text-indigo-500"
//             >
//               Sign in
//             </button>
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Home;
