import CapabilitySets from '../../../support/dictionary/capabilitySets';
import OrderEmailTemplates from '../../../support/fragments/settings/orders/orderEmailTemplates';
import SettingOrdersNavigationMenu from '../../../support/fragments/settings/orders/settingOrdersNavigationMenu';
import SettingsPane from '../../../support/fragments/settings/settingsPane';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import TopMenu from '../../../support/fragments/topMenu';
import Users from '../../../support/fragments/users/users';
import getRandomPostfix from '../../../support/utils/stringTools';

describe('Orders', () => {
  describe('Settings (Orders)', () => {
    let testData;

    before('Create test data', () => {
      const postfix = getRandomPostfix();
      const bodyText = `Bestellung Mono Kauf Text_${postfix}`;

      testData = {
        emailTemplate: OrderEmailTemplates.getDefaultOrderEmailTemplate({
          additionalProperties: {
            name: `AT_C1621364_Bestellung Mono Kauf_${postfix}`,
            description: `E-Mail-Bestellformular für Monographie-Bestellungen Kauf_${postfix}`,
            localizedTemplates: {
              en: {
                header: `Bestellung SLUB Dresden_${postfix}`,
                body: `<p>${bodyText} {{organization.name}}</p>`,
              },
            },
          },
        }),
        bodyText,
      };

      cy.getAdminToken();
      OrderEmailTemplates.createOrderEmailTemplateViaApi(testData.emailTemplate);

      cy.createTempUser([]).then((userProperties) => {
        testData.user = userProperties;

        cy.assignCapabilitiesToExistingUser(
          testData.user.userId,
          [],
          [CapabilitySets.uiOrdersSettingsView, CapabilitySets.uiOrdersSettingsEmailTemplatesView],
        );

        cy.login(testData.user.username, testData.user.password, {
          path: TopMenu.settingsPath,
          waiter: SettingsPane.waitLoading,
        });
        SettingsMenu.selectOrders();
        SettingOrdersNavigationMenu.selectOrderEmailTemplates();
        OrderEmailTemplates.waitLoading();
      });
    });

    after('Delete test data', () => {
      cy.getAdminToken();
      OrderEmailTemplates.deleteOrderEmailTemplateViaApi(testData.emailTemplate.id);
      Users.deleteViaApi(testData.user.userId);
    });

    it(
      'C1621364 Selecting an order email template opens a read-only detail pane with correct accordions and values (thunderjet)',
      { tags: ['extendedPath', 'thunderjet', 'C1621364'] },
      () => {
        const { name, description, localizedTemplates } = testData.emailTemplate;

        // #1 Click the "Bestellung Mono Kauf" template in the list
        OrderEmailTemplates.selectTemplate(name);
        OrderEmailTemplates.verifyTemplateDetailsPane(name);

        // #2 Expand and review the "General information" accordion
        OrderEmailTemplates.verifyGeneralInformation(name, {
          name,
          active: 'Yes',
          description,
        });

        // #3 Expand and review the "Template content" accordion
        OrderEmailTemplates.verifyTemplateContent(name, {
          subject: localizedTemplates.en.header,
          body: testData.bodyText,
        });
      },
    );
  });
});
