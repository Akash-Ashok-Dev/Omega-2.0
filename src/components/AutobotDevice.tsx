export function AutobotDevice() {
  return (
    <div className="autobot-device">
      <div className="autobot-rings" aria-hidden="true" />
      <div className="autobot-rings autobot-rings--outer" aria-hidden="true" />

      <div className="autobot-holo">
        <img
          src="/Autobots Logo.jpg"
          alt="OMEGA Core Insignia"
          className="autobot-img"
        />

        <div className="autobot-scan" aria-hidden="true" />
        <div className="autobot-glitch" aria-hidden="true" />
      </div>

      <div className="autobot-corner autobot-corner--top" aria-hidden="true" />
      <div className="autobot-corner autobot-corner--bottom" aria-hidden="true" />
      <div className="autobot-corner autobot-corner--left" aria-hidden="true" />
      <div className="autobot-corner autobot-corner--right" aria-hidden="true" />

      <div className="autobot-status">[ SYSTEM : ONLINE ]</div>
    </div>
  );
}

export default AutobotDevice;
