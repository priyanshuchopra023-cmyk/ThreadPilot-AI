import React from 'react';
import { ThreadAI } from './ThreadAI';

/**
 * Backward compatibility alias for Copilot -> Thread AI
 */
export const Copilot: React.FC = () => {
  return <ThreadAI />;
};

export default Copilot;
