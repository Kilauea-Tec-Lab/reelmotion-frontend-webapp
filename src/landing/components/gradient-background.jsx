import React from "react";

const GradientBackground = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <style>{`
        @keyframes moveVertical {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(50%); }
        }
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveHorizontal {
          0%, 100% { transform: translateX(-50%) translateY(-10%); }
          50% { transform: translateX(50%) translateY(10%); }
        }
      `}</style>

      {/* Pink blob */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "80%",
          height: "80%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(220,86,157,0.8), transparent 50%)",
          filter: "blur(80px)",
          mixBlendMode: "hard-light",
          opacity: 0.8,
          animation: "moveVertical 30s ease infinite",
        }}
      />

      {/* Yellow blob */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "80%",
          height: "80%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(242,213,67,0.6), transparent 50%)",
          filter: "blur(80px)",
          mixBlendMode: "hard-light",
          opacity: 0.7,
          animation: "moveInCircle 20s reverse ease infinite",
        }}
      />

      {/* Purple blob */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "80%",
          height: "80%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(120,50,180,0.7), transparent 50%)",
          filter: "blur(80px)",
          mixBlendMode: "hard-light",
          opacity: 0.7,
          animation: "moveInCircle 40s ease infinite",
        }}
      />

      {/* Dark blue blob */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "80%",
          height: "80%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(30,30,100,0.5), transparent 50%)",
          filter: "blur(80px)",
          mixBlendMode: "hard-light",
          opacity: 0.6,
          animation: "moveHorizontal 40s ease infinite",
        }}
      />

      {/* Subtle white blob */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "80%",
          height: "80%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.3), transparent 50%)",
          filter: "blur(80px)",
          mixBlendMode: "hard-light",
          opacity: 0.6,
          animation: "moveInCircle 20s ease infinite",
        }}
      />
    </div>
  );
};

export default GradientBackground;
