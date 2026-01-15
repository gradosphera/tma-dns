import { List, Text } from "@telegram-apps/telegram-ui";

import gradospheraFooterSvg from "./gradosphera.svg";

const Footer = () => (
  <div style={{ position: "relative", marginTop: "auto" }}>
    <List
      style={{
        padding: "20px",
        backgroundColor: "var(--tg-theme-bg-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src={gradospheraFooterSvg} alt="TON Logo" style={{ width: "24px", height: "24px" }} />
          <Text style={{ fontSize: "12px", color: "var(--tg-theme-hint-color)", fontWeight: "bold" }}>
            Домены
          </Text>
        </div>
        <Text style={{ fontSize: "12px", color: "var(--tg-theme-hint-color)" }}>
          {new Date().getFullYear()} ДАО Градосфера
        </Text>
      </div>
    </List>
  </div>
);

export default Footer;
