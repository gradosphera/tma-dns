import { FC } from "react";
import {
  Banner,
  ButtonCell,
  Cell,
  List,
  Section,
} from "@telegram-apps/telegram-ui";
import {
  Icon24Globe,
  Icon24FolderSimpleOutline,
  Icon24FolderSimplePlusOutline,
  Icon24PenOutline,
  Icon24AddCircleOutline,
} from "@vkontakte/icons";
import { Link } from "@/components/Link/Link.tsx";
import { Page } from "@/components/Page";

const IconWrapper = ({ children, bgColor }: { children: React.ReactNode; bgColor: string }) => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

export const IndexPage: FC = () => {
  return (
    <Page back={false}>
      <Banner
        type="section"
        header="Домены *.gradosphera.ton"
        subheader="Упрощённое управление доменами ДАО Градосфера"
        description="Легко управляйте доменами, настраивайте DNS записи, создавайте поддомены и организуйте коллекции — всё в одном месте."
       style={{ background: "transparent", boxShadow: "none" }}
      />

      <List>
        <Section>
          <Cell
            before={
              <IconWrapper bgColor="#FF9800">
                <Icon24FolderSimpleOutline color="#FFFFFF" />
              </IconWrapper>
            }
            subtitle="Создать коллекцию поддоменов"
            multiline
          >
            Создать коллекцию
          </Cell>
          <Link to="/create-collection">
            <ButtonCell before={<Icon24AddCircleOutline />}>Создать</ButtonCell>
          </Link>
        </Section>
      </List>

      <List>
        <Section>
          <Cell
            before={
              <IconWrapper bgColor="#4CAF50">
                <Icon24FolderSimplePlusOutline color="#FFFFFF" />
              </IconWrapper>
            }
            subtitle="Добавить поддомен в коллекцию"
            multiline
          >
            Добавить поддомен
          </Cell>
          <Link to="/add-subdomain">
            <ButtonCell before={<Icon24AddCircleOutline />}>Добавить</ButtonCell>
          </Link>
        </Section>
      </List>

      <List>
        <Section>
          <Cell
            before={
              <IconWrapper bgColor="#2196F3">
                <Icon24Globe color="#FFFFFF" />
              </IconWrapper>
            }
            subtitle="Редактировать и управлять DNS записями"
            multiline
          >
            Управление DNS
          </Cell>
          <Link to="/manage">
            <ButtonCell before={<Icon24PenOutline />}>Управлять</ButtonCell>
          </Link>
        </Section>
      </List>
      <Cell />
    </Page>
  );
};
