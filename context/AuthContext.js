import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch user profile from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUserProfile(userDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (email, password, userData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, { displayName: userData.fullName });

            // Create user document in Firestore
            const userDoc = {
                uid: user.uid,
                email: user.email,
                fullName: userData.fullName,
                phone: userData.phone,
                role: userData.role, // 'donor', 'patient', 'ngo'
                bloodGroup: userData.bloodGroup || null,
                location: userData.location || null,
                isAvailable: userData.role === 'donor' ? true : false,
                organizationName: userData.organizationName || null,
                organizationType: userData.organizationType || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'users', user.uid), userDoc);
            setUserProfile(userDoc);

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const updateUserProfile = async (updates) => {
        try {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const updatedData = {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };

                await updateDoc(userRef, updatedData);
                setUserProfile(prev => ({ ...prev, ...updatedData }));

                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
