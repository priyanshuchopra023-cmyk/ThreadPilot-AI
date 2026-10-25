import React from 'react';
import { ThreadWeave3D } from './ThreadWeave3D';

interface AuthHeroIllustrationProps {
  className?: string;
  showMicroHud?: boolean;
}

/**
 * AuthHeroIllustration
 * Signature 3D visual experience showcasing the ThreadPilot AI
 * interwoven textile thread geometry, telemetry nodes, and architecture.
 */
export const AuthHeroIllustration: React.FC<AuthHeroIllustrationProps> = ({
  className = '',
}) => {
  return (
    <div className={`relative w-full select-none ${className}`}>
      <ThreadWeave3D />
    </div>
  );
};

export default AuthHeroIllustration;
