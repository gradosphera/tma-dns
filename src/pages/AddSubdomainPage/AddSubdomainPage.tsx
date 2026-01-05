import { FC, useState, useCallback, useMemo } from "react";
import {
  Banner,
  Button,
  Card,
  Cell,
  IconButton,
  Image,
  Input,
  List,
  Section,
} from "@telegram-apps/telegram-ui";
import { useTonWallet, useTonAddress } from "@tonconnect/ui-react";
import { Icon16Cancel } from "@vkontakte/icons";
import { Address } from "@ton/core";

import { Page } from "@/components/Page";
import { ShowSnackbar } from "@/components/ShowSnackbar";
import { useDNSSubdomain } from "@/hooks/useDNSSubdomain";
import { useTonAPI } from "@/hooks/useTonAPI";

export const AddSubdomainPage: FC = () => {
  const wallet = useTonWallet();
  const address = useTonAddress();
  const isTestnet = wallet?.account?.chain === "-3";

  const { getNftCollection, getCodeHash, getNftItem } = useTonAPI(isTestnet);
  const { subdomain } = useDNSSubdomain();

  const [snackbar, setSnackbar] = useState<JSX.Element | null>(null);
  const [collectionAddress, setCollectionAddress] = useState("");
  const [isCollectionValid, setIsCollectionValid] = useState(false);
  const [checkingCollection, setCheckingCollection] = useState(false);
  const [collectionData, setCollectionData] = useState<{ title: string; image?: string } | null>(null);

  const [subdomainName, setSubdomainName] = useState("");
  const [isSubdomainValid, setIsSubdomainValid] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const validCodeHashes = [
      "3jXlcwOASQG0nNPW1YpxfOynmrh2FsgAMqdMl8MiIB0=",
  ];

  const showSnackbar = useCallback((message: string, type: "success" | "error" = "success") => {
    setSnackbar(<ShowSnackbar message={message} type={type} onClose={() => setSnackbar(null)} />);
  }, []);

  const handleCheckCollection = useCallback(async () => {
    if (!collectionAddress.trim()) {
      showSnackbar("Пожалуйста, введите адрес коллекции!", "error");
      return;
    }

    setCheckingCollection(true);
    try {
      const fetchedCodeHash = await getCodeHash(collectionAddress.trim());
      await new Promise((res) => setTimeout(res, 1500));

      if (!fetchedCodeHash || !validCodeHashes.includes(fetchedCodeHash)) {
        showSnackbar("Неправильный адрес коллекции!", "error");
        setIsCollectionValid(false);
        return;
      }
      const collection = await getNftCollection(collectionAddress);
      await new Promise((res) => setTimeout(res, 1500));
      if (!collection) {
        showSnackbar("Неправильный адрес коллекции!", "error");
        setIsCollectionValid(false);
        return;
      }

      if (Address.parse(collection.owner_address).toString() !== Address.parse(address).toString()) {
        showSnackbar("Коллекция вам не принадлежит!", "error");
        setIsCollectionValid(false);
        return;
      }

      setCollectionData({
        title: collection.title,
        image: `https://dns.gradosphera.org/api/ton/${collection.title.split(" ")[0].toLowerCase()}.png`,
      });

      setIsCollectionValid(true);
    } catch (error) {
      showSnackbar("Ошибка при проверке коллекции!", "error");
    } finally {
      setCheckingCollection(false);
    }
  }, [collectionAddress, getCodeHash, showSnackbar]);

  const isValidSubdomain = (subdomain: string) => {
    if (!subdomain) return false;

    if (subdomain.length < 1 || subdomain.length > 64) return false;
    if (!/^[a-z0-9-]+$/.test(subdomain)) return false;
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) return false;

    return true;
  };

  const handleCheckSubdomain = useCallback(async () => {
    if (!subdomainName.trim()) {
      showSnackbar("Пожалуйста, введите имя поддомена!", "error");
      return;
    }
    if (!isValidSubdomain(subdomainName)) {
      showSnackbar("Неправильный формат поддомена! Используйте только a-z, 0-9 и '-', но не в начале или конце.", "error");
      return;
    }

    setCheckingSubdomain(true);
    try {
      const itemAddress = await subdomain.getItemAddress(collectionAddress, subdomainName);
      const result = await getNftItem(itemAddress.toString());

      if (result?.title) {
        showSnackbar("Поддомен уже занят!", "error");
        setIsSubdomainValid(false);
        return;
      }

      setIsSubdomainValid(true);
      showSnackbar("Поддомен доступен!", "success");
    } catch (error) {
        console.log(error);
      showSnackbar("Ошибка при проверке поддомена!", "error");
    } finally {
      setCheckingSubdomain(false);
    }
  }, [subdomainName, collectionAddress, getNftItem, showSnackbar]);

  const handleDeploySubdomain = useCallback(async () => {
    if (!wallet) {
      showSnackbar("Кошелёк не подключён!", "error");
      return;
    }
    if (!isCollectionValid || !isSubdomainValid) {
      showSnackbar("Неправильная коллекция или поддомен!", "error");
      return;
    }

    setLoading(true);
    try {
      await subdomain.sendTransaction(collectionAddress, subdomainName);
      showSnackbar("Транзакция подтверждена кошельком. Ожидание подтверждения сетью.", "success");

      setSubdomainName("");
      setIsSubdomainValid(false);
      setImageLoaded(false);
    } catch (error) {
      showSnackbar("Не удалось развернуть поддомен!", "error");
    } finally {
      setLoading(false);
    }
  }, [wallet, isCollectionValid, isSubdomainValid, collectionAddress, subdomainName, showSnackbar]);

  const handleResetSubdomain = () => {
    setSubdomainName("");
    setIsSubdomainValid(false);
    setImageLoaded(false);
  };

  const subdomainPreview = useMemo(() => {
    if (!collectionData || !subdomainName) return null;
    return {
      image: `https://dns.gradosphera.org/api/ton/${subdomainName}/${collectionData.title.split(" ")[0].toLowerCase()}.png`,
    };
  }, [subdomainName, collectionData]);

  return (
    <Page back={true}>
      {snackbar}

      <Banner
        type="section"
        header="Добавить поддомен"
        subheader="Привязать новый поддомен к вашей коллекции"
        description="Введите адрес вашей коллекции, проверьте доступность и разверните свой уникальный поддомен."
        style={{ background: "transparent", boxShadow: "none" }}
      />

      <List>
        <Section header={<Section.Header>Адрес коллекции</Section.Header>}>
          {isCollectionValid && collectionData ? (
            <Cell
              subtitle="NFT коллекция"
              before={collectionData.image ? <Image src={collectionData.image} /> : null}
              after={
                <IconButton
                  mode="plain"
                  size="l"
                  onClick={() => {
                    setCollectionAddress("");
                    setIsCollectionValid(false);
                    setCollectionData(null);
                  }}
                >
                  <Icon16Cancel />
                </IconButton>
              }
            >
              {collectionData.title}
            </Cell>
          ) : (
            <Input
              placeholder="Адрес (например, EQ...)"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              after={
                <Button size="s" onClick={handleCheckCollection} mode="plain" loading={checkingCollection}>
                  Проверить
                </Button>
              }
            />
          )}
        </Section>
      </List>

      {isCollectionValid && !isSubdomainValid && (
        <List>
          <Section header={<Section.Header>Имя поддомена</Section.Header>}>
            <Input
              placeholder="Имя поддомена"
              value={subdomainName}
              onChange={(e) => setSubdomainName(e.target.value.toLowerCase())}
              after={
                <Button size="s" onClick={handleCheckSubdomain} mode="plain" loading={checkingSubdomain}>
                  Проверить
                </Button>
              }
            />
          </Section>
        </List>
      )}

      {isSubdomainValid && subdomainPreview && (
        <List>
          <Section header={<Section.Header>Предпросмотр поддомена</Section.Header>}>
            <Card style={{ display: imageLoaded ? "block" : "none", position: "relative", overflow: "hidden" }}>
              <IconButton
                mode="plain"
                size="s"
                onClick={handleResetSubdomain}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease-in-out",
                }}
              >
                <Icon16Cancel fill="white" />
              </IconButton>

              <img
                src={subdomainPreview.image}
                onLoad={() => setImageLoaded(true)}
                style={{
                  display: imageLoaded ? "block" : "none",
                  width: "100%",
                  transition: "opacity 0.3s ease-in-out",
                  opacity: imageLoaded ? 1 : 0,
                  borderRadius: "8px",
                }}
              />
            </Card>
          </Section>

          <Button style={{ display: imageLoaded ? "block" : "none"}} onClick={handleDeploySubdomain} loading={loading} stretched size="l">
            Развернуть поддомен
          </Button>
        </List>
      )}
    <br />
    <br />
    </Page>
  );
};
