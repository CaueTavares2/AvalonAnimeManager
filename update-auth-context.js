const fs = require('fs');

let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

// Replace imports
content = content.replace(
  "signInWithPopup,",
  "signInWithPopup,\n  signInWithEmailAndPassword,\n  createUserWithEmailAndPassword,"
);

// Add to context type
content = content.replace(
  "loginWithGoogle: () => Promise<void>;",
  "loginWithGoogle: () => Promise<void>;\n  loginWithEmail: (e: string, p: string) => Promise<void>;\n  registerWithEmail: (e: string, p: string) => Promise<void>;"
);

// Add implementations
const newFunctions = `
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = async () => {`;

content = content.replace("const logout = async () => {", newFunctions);

content = content.replace(
  "loginWithGoogle, logout, isAdmin,",
  "loginWithGoogle, loginWithEmail, registerWithEmail, logout, isAdmin,"
);

fs.writeFileSync('src/context/AuthContext.tsx', content);
console.log("Updated AuthContext.tsx");
