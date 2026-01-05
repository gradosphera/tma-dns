import React, { useState } from "react";
import { useTonWallet, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Button, Caption, Cell, Modal, Placeholder, Title } from "@telegram-apps/telegram-ui";

import { shortenAddress } from "@/utils/address";

import "./style.css";
import gradospheraSvg from "./gradosphera.svg";
import telegramGif from "./telegram.gif";

const Header: React.FC = () => {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUi] = useTonConnectUI();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTestnet = wallet?.account?.chain === "-3";

  const handleDisconnect = (): void => {
    tonConnectUi.disconnect();
    setIsModalOpen(false);
  };

  return (
    <>
      {isTestnet && (
        <div className="testnetBanner">
          <Caption>Внимание! Это тестовая версия.</Caption>
        </div>
      )}
      <div className="headerContainer">
        <Cell
          style={{ margin: "10px 0" }}
          before={
            <div className="logoContainer">
              <img src={gradospheraSvg} alt="TON Logo" className="logoImage" />
              <Title weight="1" >Домены</Title>
            </div>
          }
          after={
            wallet ? (
              <Modal
                overlayComponent={
                  <div className="modalOverlay" style={{ opacity: isModalOpen ? 1 : 0 }} />
                }
                trigger={
                  <Button style={{ outline: "none" }} mode="bezeled">
                    {shortenAddress(address)}
                  </Button>
                }
                onOpenChange={setIsModalOpen}
              >
                <Placeholder description="Вы уверены, что хотите отключиться?" header="Подтвердите отключение">
                  <img alt="Telegram sticker" src={telegramGif} className="modalImage" />
                </Placeholder>
                <Placeholder>
                  <Button mode="bezeled" onClick={handleDisconnect}>
                    Да, отключиться
                  </Button>
                </Placeholder>
              </Modal>
            ) : (
              <Button style={{ backgroundColor: "#2196F3" }} onClick={() => tonConnectUi.openModal()}>Подключить кошелёк</Button>
            )
          }
        />
      </div>
    </>
  );
};

export default Header;
