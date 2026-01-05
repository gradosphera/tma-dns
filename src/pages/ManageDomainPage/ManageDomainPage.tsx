import { FC, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import {
  Banner,
  Button,
  Cell,
  Checkbox,
  IconButton,
  Image,
  Input,
  List,
  Placeholder,
  Section,
} from "@telegram-apps/telegram-ui";
import { Address } from "ton-core";

import { useTonWallet } from "@tonconnect/ui-react";
import { Icon16Cancel } from "@vkontakte/icons";

import { Page } from "@/components/Page";
import { ShowSnackbar } from "@/components/ShowSnackbar";

import { useTonAPI } from "@/hooks/useTonAPI";
import { useDNSManager } from "@/hooks/useDNSManager";

import { shortenAddress } from "@/utils/address";
import { AdnlAddress, StorageBagId } from "@/utils/validators";

interface FormData {
  tonSite: string;
  isChecked: boolean;
  tonStorage: string;
  walletAddress: string;
  subdomains: string;
}

export const ManageDomainPage: FC = () => {
  const wallet = useTonWallet();
  const { manager } = useDNSManager();

  const isTestnet = wallet?.account?.chain === "-3";
  const { runGetMethod, getNftItem, getNftCollection } = useTonAPI(isTestnet);

  const [snackbar, setSnackbar] = useState<JSX.Element | null>(null);

  const [resolverAddress, setResolverAddress] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [checkingResolver, setCheckingResolver] = useState(false);
  const [resolverData, setResolverData] = useState<{ title: string; image?: string; subtitle?: string }>({
    title: "",
    image: "",
    subtitle: "",
  });
  const [isAutoCheckTriggered, setIsAutoCheckTriggered] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    tonSite: "",
    isChecked: false,
    tonStorage: "",
    walletAddress: "",
    subdomains: "",
  });

  const showSnackbar = (message: string, type: "success" | "error" | "sent" = "success") => {
    setSnackbar(<ShowSnackbar message={message} type={type} onClose={() => setSnackbar(null)} />);
  };


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const address = params.get("address")
    if (address) {
      setResolverAddress(Address.parse(address).toString());
      setIsAutoCheckTriggered(true);
    }
  }, []);

  useEffect(() => {
    if (isAutoCheckTriggered && resolverAddress) {
      handleCheckResolverAddress();
      setIsAutoCheckTriggered(false);
    }
  }, [resolverAddress, isAutoCheckTriggered]);

  const handleInputChange = (key: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckResolverAddress = async () => {
    if (!resolverAddress) {
      showSnackbar("Введите DNS адрес!", "error");
      return;
    }
    const resolverAddressNew = Address.parse(resolverAddress).toString();
    setCheckingResolver(true);
    const dnsResult = await runGetMethod(resolverAddressNew, "dnsresolve", []);
    if (!dnsResult.success) {
      showSnackbar("Неправильный DNS адрес!", "error");
      setIsVerified(false);
      setCheckingResolver(false);
      return;
    }
    let result = await getNftItem(resolverAddressNew);
    if (!result || result.title === "") {
      await new Promise((res) => setTimeout(res, 1500));
      result = await getNftCollection(resolverAddressNew);
    }
    if (!result || result.title === "") {
      result = {
        title: shortenAddress(resolverAddressNew),
        image: "",
        subtitle: " ",
        owner_address: resolverAddressNew || ""
      };
    }

    if (result) {
      setResolverData(result);
    }
    setIsVerified(true);
    setCheckingResolver(false);
  };

  const handleSaveTonSite = async () => {
    try {
      if (!resolverAddress) throw new Error("Ошибка: отсутствует DNS адрес!");
      let payload;
      if (formData.tonSite) {
        const addr = new AdnlAddress(formData.tonSite);
        payload = manager.createSiteBody(addr, formData.isChecked);
      } else {
        payload = manager.createDeleteRecordBody("site");
      }
      await manager.sendTransaction(resolverAddress, payload);
      showSnackbar(
        "Транзакция подтверждена кошельком. Ожидание подтверждения сетью.",
        "sent"
      );
    } catch (error: any) {
      console.error(error);
      showSnackbar(error.message, "error");
    }
  };

  const handleSaveTonStorage = async () => {
    try {
      if (!resolverAddress) throw new Error("Ошибка: отсутствует DNS адрес!");
      let payload;
      if (formData.tonStorage) {
        const bagId = new StorageBagId(formData.tonStorage);
        payload = manager.createStorageBody(bagId);
      } else {
        payload = manager.createDeleteRecordBody("storage");
      }
      await manager.sendTransaction(resolverAddress, payload);
      showSnackbar(
        "Транзакция подтверждена кошельком. Ожидание подтверждения сетью.",
        "sent"
      );
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const handleSaveWalletAddress = async () => {
    try {
      if (!resolverAddress) {
        alert("Ошибка: отсутствует DNS адрес!");
        return;
      }
      const payload = formData.walletAddress
        ? manager.createWalletBody(formData.walletAddress)
        : manager.createDeleteRecordBody("wallet");

      await manager.sendTransaction(resolverAddress, payload);
      showSnackbar(
        "Транзакция подтверждена кошельком. Ожидание подтверждения сетью.",
        "sent"
      );
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const handleSaveSubdomains = async () => {
    try {
      if (!resolverAddress) {
        alert("Ошибка: отсутствует DNS адрес!");
        return;
      }
      const payload = formData.subdomains
        ? manager.createResolverBody(formData.subdomains)
        : manager.createDeleteRecordBody("dns_next_resolver");
      await manager.sendTransaction(resolverAddress, payload);
      showSnackbar(
        "Транзакция подтверждена кошельком. Ожидание подтверждения сетью.",
        "sent"
      );
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };
  const location = useLocation();

  return (
    <Page back={true}>
      {snackbar}
      <Banner
        type="section"
        header="Управление субдоменами"
        subheader="Легко настройте параметры вашего домена"
        description="Введите адрес NFT, коллекции или другого DNS контракта для управления его DNS записями, привязки TON сайта, обновления хранилища и назначения адресов кошельков."
        style={{ background: "transparent", boxShadow: "none" }}
      />

      <List>
        <Section
          header={<Section.Header>DNS адрес</Section.Header>}
          footer={<Section.Footer>Адрес NFT, коллекции или другого DNS контракта</Section.Footer>}
        >
          {isVerified ? (
            <Section>
              <Cell
                subtitle={resolverData.subtitle}
                before={resolverData.image ? <Image src={resolverData.image} /> : null}
                after={
                  <IconButton
                    mode="plain"
                    size="l"
                    onClick={() => {
                      setResolverAddress("");
                      setIsVerified(false);
                    }}
                  >
                    <Icon16Cancel />
                  </IconButton>
                }
              >
                {resolverData.title}
              </Cell>
            </Section>
          ) : (
            <Input
              placeholder="Адрес (начинается на EQ...)"
              value={resolverAddress}
              onChange={(e) => setResolverAddress(e.target.value)}
              after={
                <Button size="s" onClick={handleCheckResolverAddress} mode="plain" loading={checkingResolver}>
                  Проверить
                </Button>
              }
            />
          )}
        </Section>
      </List>

      {isVerified && (
        <List>
          <Section header={<Section.Header large={false}>TON сайты</Section.Header>}>
            <div style={{ overflow: "hidden", border: "none", paddingBottom: 0 }}>
              <Input
                placeholder="ADNL адрес"
                value={formData.tonSite}
                onChange={(e) => handleInputChange("tonSite", e.target.value)}
                after={<Button size="s" mode="plain" onClick={handleSaveTonSite}>Сохранить</Button>}
              />
              <Cell
                Component="label"
                description="Разместить в TON Storage"
                before={
                  <Checkbox
                    value="1"
                    checked={formData.isChecked}
                    onChange={() => handleInputChange("isChecked", !formData.isChecked)}
                  />
                }
              />
            </div>
          </Section>

          <Section header={<Section.Header large={false}>TON хранилище</Section.Header>}>
            <Input
              placeholder="HEX"
              value={formData.tonStorage}
              onChange={(e) => handleInputChange("tonStorage", e.target.value)}
              after={<Button size="s" mode="plain" onClick={handleSaveTonStorage}>Сохранить</Button>}
            />
          </Section>

          <Section header={<Section.Header large={false}>Адрес кошелька</Section.Header>}>
            <Input
              placeholder="Адрес (например, UQ...)"
              value={formData.walletAddress}
              onChange={(e) => handleInputChange("walletAddress", e.target.value)}
              after={<Button size="s" mode="plain" onClick={handleSaveWalletAddress}>Сохранить</Button>}
            />
          </Section>

          <Section header={<Section.Header large={false}>Адрес поддоменов</Section.Header>}>
            <Input
              placeholder="Адрес (например, EQ...)"
              value={formData.subdomains}
              onChange={(e) => handleInputChange("subdomains", e.target.value)}
              after={<Button size="s" mode="plain" onClick={handleSaveSubdomains}>Сохранить</Button>}
            />
          </Section>
        </List>
      )}
    <Placeholder />
    </Page>
  );
};
