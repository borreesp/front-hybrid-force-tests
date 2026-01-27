"use client";
import React, { createContext, useContext } from "react";

const ApiTokenContext = createContext<string | null>(null);

export const ApiTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ApiTokenContext.Provider value={null}>{children}</ApiTokenContext.Provider>;
};

export const useApiToken = () => useContext(ApiTokenContext);
