import React, { createContext, useContext, useEffect, useState } from 'react';
import { Operator } from '../types';
import { getCurrentOperator, getStoredOperators, saveCurrentOperator, saveStoredOperators } from '../utils/storage';

interface AuthContextType {
  currentOperator: Operator;
  operators: Operator[];
  switchOperator: (operatorId: string, pin?: string) => boolean;
  addOperator: (operator: Omit<Operator, 'id'>) => Operator;
  updateOperator: (id: string, updates: Partial<Operator>) => void;
  deleteOperator: (id: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operators, setOperators] = useState<Operator[]>(getStoredOperators);
  const [currentOperator, setCurrentOperatorState] = useState<Operator>(getCurrentOperator);

  useEffect(() => {
    const handleStorageChange = () => {
      setOperators(getStoredOperators());
      setCurrentOperatorState(getCurrentOperator());
    };
    window.addEventListener('odelot_operators_changed', handleStorageChange);
    window.addEventListener('odelot_operator_changed', handleStorageChange);
    return () => {
      window.removeEventListener('odelot_operators_changed', handleStorageChange);
      window.removeEventListener('odelot_operator_changed', handleStorageChange);
    };
  }, []);

  const switchOperator = (operatorId: string, pin?: string): boolean => {
    const target = operators.find((op) => op.id === operatorId);
    if (!target) return false;

    if (pin !== undefined && target.pin && target.pin !== pin) {
      return false;
    }

    setCurrentOperatorState(target);
    saveCurrentOperator(target);
    return true;
  };

  const addOperator = (newOp: Omit<Operator, 'id'>): Operator => {
    const created: Operator = {
      ...newOp,
      id: `op-${Date.now()}`,
    };
    const updated = [...operators, created];
    setOperators(updated);
    saveStoredOperators(updated);
    return created;
  };

  const updateOperator = (id: string, updates: Partial<Operator>) => {
    const updated = operators.map((op) => (op.id === id ? { ...op, ...updates } : op));
    setOperators(updated);
    saveStoredOperators(updated);
    if (currentOperator.id === id) {
      const updatedCurr = { ...currentOperator, ...updates };
      setCurrentOperatorState(updatedCurr);
      saveCurrentOperator(updatedCurr);
    }
  };

  const deleteOperator = (id: string): boolean => {
    if (operators.length <= 1) return false; // Must keep at least one
    const updated = operators.filter((op) => op.id !== id);
    setOperators(updated);
    saveStoredOperators(updated);
    if (currentOperator.id === id) {
      const fallback = updated[0];
      setCurrentOperatorState(fallback);
      saveCurrentOperator(fallback);
    }
    return true;
  };

  const isAdmin = currentOperator.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentOperator,
        operators,
        switchOperator,
        addOperator,
        updateOperator,
        deleteOperator,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
