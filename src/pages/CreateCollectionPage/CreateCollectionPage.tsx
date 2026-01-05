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
import { Address } from "@ton/core";
import { Icon16Cancel } from "@vkontakte/icons";

import { Page } from "@/components/Page";
import { ShowSnackbar } from "@/components/ShowSnackbar";
import { useTonAPI } from "@/hooks/useTonAPI";
import { useDNSCollection } from "@/hooks/useDNSCollection";

export const CreateCollectionPage: FC = () => {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const { collection } = useDNSCollection();

  const isTestnet = wallet?.account?.chain === "-3";
  const { getNftDomainItem } = useTonAPI(isTestnet);

  const TON_DNS_COLLECTION_ADDRESS = isTestnet
    ? "kQDjPtM6QusgMgWfl9kMcG-EALslbTITnKcH8VZK1pnH3f3K"
    : "EQC3dNlesgVD8YbAazcauIrXBPfiVhMMr5YYk2in0Mtsz0Bz";

  const ROYALTY_ADDRESS = isTestnet
    ? "0QASgfDPFbdLTVf_lXAqP_hdnBjEALIuJtHlMxvUmpNid8qx"
    : "UQCDrgGaI6gWK-qlyw69xWZosurGxrpRgIgSkVsgahUtxZR0";

  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState<JSX.Element | null>(null);
  const [domainAddress, setDomainAddress] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainData, setDomainData] = useState<{ title: string; image?: string; subtitle?: string } | null>(null);


  const showSnackbar = useCallback((message: string, type: "success" | "error" | "sent" = "success") => {
    setSnackbar(<ShowSnackbar message={message} type={type} onClose={() => setSnackbar(null)} />);
  }, []);

  const formatDomainName = (domain: string) =>
    domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();

  const checkDomainOwnership = useCallback(async () => {
    if (!domainAddress.trim()) {
      showSnackbar("Пожалуйста, введите DNS адрес!", "error");
      return;
    }

    setCheckingDomain(true);
    try {
      const result = await getNftDomainItem(domainAddress, TON_DNS_COLLECTION_ADDRESS);

      if (!result?.title) {
        showSnackbar("Неправильный адрес домена!", "error");
        return;
      }
      if (!result?.owner_address) {
        showSnackbar("Не удалось найти адрес владельца домена!", "error");
        return;
      }
      if (Address.parse(result.owner_address).toString() !== Address.parse(address).toString()) {
        showSnackbar("Адрес домена вам не принадлежит!", "error");
        return;
      }

      setDomainData(result);
      setIsVerified(true);
    } catch (error) {
      console.error(error);
      showSnackbar("Ошибка при проверке домена!", "error");
    } finally {
      setCheckingDomain(false);
    }
  }, [domainAddress, getNftDomainItem, showSnackbar, TON_DNS_COLLECTION_ADDRESS, address]);

  const collectionPreview = useMemo(() => {
    if (!domainData) return null;
    return {
      title: `DNS домены ${formatDomainName(domainData.title)} DNS Domains`,
      subtitle: `Домены *.${domainData.title.toLowerCase()}.ton`,
      image: `https://dns.gradosphera.org/api/ton/${domainData.title.toLowerCase()}.png`,
    };
  }, [domainData]);

  const deployCollection = useCallback(async () => {
    if (!wallet) {
      showSnackbar("Кошелёк не подключён!", "error");
      return;
    }

    if (!domainAddress.trim() || !domainData?.title) {
      showSnackbar("Пожалуйста, введите корректный адрес домена!", "error");
      return;
    }

    setLoading(true);
    try {
      await collection.deployCollection(address, ROYALTY_ADDRESS, domainData.title, domainAddress);
      showSnackbar("Транзакция подтверждена кошельком. Ожидание подтверждения сетью.", "success");

      setIsVerified(false);
      setDomainData(null);
      setDomainAddress("");
    } catch (error) {
      console.error(error);
      showSnackbar("Не удалось развернуть коллекцию!", "error");
    } finally {
      setLoading(false);
    }
  }, [wallet, collection, address, ROYALTY_ADDRESS, domainData, domainAddress, showSnackbar]);

  return (
    <Page back={true}>
      {snackbar}
      <Banner
        type="section"
        header="Создайте свою NFT коллекцию"
        subheader="Превратите свой домен в NFT коллекцию"
        description="Подтвердите владение доменом и разверните уникальную NFT коллекцию на TON. Легко управляйте своими поддоменами."
        style={{ background: "transparent", boxShadow: "none" }}
       />

      <List>
        <Section
          header={<Section.Header>Адрес домена</Section.Header>}
          footer={<Section.Footer>Адрес NFT домена для вашей коллекции.</Section.Footer>}
        >
          {isVerified && domainData ? (
            <Cell
              subtitle={domainData.subtitle}
              before={domainData.image ? <Image src={domainData.image} /> : null}
              after={
                <IconButton
                  mode="plain"
                  size="l"
                  onClick={() => {
                    setDomainAddress("");
                    setIsVerified(false);
                    setDomainData(null);
                  }}
                >
                  <Icon16Cancel />
                </IconButton>
              }
            >
              {domainData.title}
            </Cell>
          ) : (
            <Input
              placeholder="Адрес (например, EQ...)"
              value={domainAddress}
              onChange={(e) => setDomainAddress(e.target.value)}
              after={
                <Button size="s" onClick={checkDomainOwnership} mode="plain" loading={checkingDomain}>
                  Проверить
                </Button>
              }
            />
          )}
        </Section>

        {collectionPreview && (
          <>
            <Section header={<Section.Header>Предпросмотр коллекции</Section.Header>}>
              <Card>
                <img
                  src={collectionPreview.image}
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    display: imageLoaded ? "block" : "none",
                    width: "100%",
                    height: imageLoaded ? "auto" : 150,
                    transition: "opacity 0.3s ease-in-out",
                    opacity: imageLoaded ? 1 : 0,
                  }}
                />
                <Card.Cell readOnly subtitle={collectionPreview.subtitle}>
                  {collectionPreview.title}
                </Card.Cell>
              </Card>
            </Section>

            <Button  style={{ display: imageLoaded ? "block" : "none"}} onClick={deployCollection} loading={loading} stretched size="l">
              Развернуть коллекцию
            </Button>
          </>
        )}
      <br />
      <br />
      </List>
    </Page>
  );
};
