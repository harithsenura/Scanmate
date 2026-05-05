import React from 'react';

// VULNERABILITY 4: Cross-Site Scripting (XSS)
// CWE-79: Improper Neutralization of Input During Web Page Generation

interface CommentProps {
  userComment: string;
}

export const UserComment: React.FC<CommentProps> = ({ userComment }) => {
  return (
    <div>
      <h3>User Comment:</h3>
      {/* Dangerous: Using dangerouslySetInnerHTML with untrusted user input */}
      <div dangerouslySetInnerHTML={{ __html: userComment }} />
    </div>
  );
};
