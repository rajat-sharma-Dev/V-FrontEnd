import { useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';

/**
 * Custom hook to access Web3 context
 * @returns {Object} Web3 context
 */
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  
  return context;
};
