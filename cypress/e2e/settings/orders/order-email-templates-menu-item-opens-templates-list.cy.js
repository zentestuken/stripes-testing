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

      testData = {
        emailTemplates: [
          OrderEmailTemplates.getDefaultOrderEmailTemplate({
            additionalProperties: { name: `AT_C1621363_Bestellung Mono Kauf_${postfix}` },
          }),
          OrderEmailTemplates.getDefaultOrderEmailTemplate({
            additionalProperties: { name: `AT_C1621363_Bestellung Zeitschriften_${postfix}` },
          }),
        ],
      };

      cy.getAdminToken();
      testData.emailTemplates.forEach((emailTemplate) => {
        OrderEmailTemplates.createOrderEmailTemplateViaApi(emailTemplate);
      });

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
      });
    });

    after('Delete test data', () => {
      cy.getAdminToken();
      testData.emailTemplates.forEach((emailTemplate) => {
        OrderEmailTemplates.deleteOrderEmailTemplateViaApi(emailTemplate.id);
      });
      Users.deleteViaApi(testData.user.userId);
    });

    it(
      'C1621363 "Order email templates" menu item is visible under Settings > Orders and opens the templates list pane (thunderjet)',
      { tags: ['extendedPath', 'thunderjet', 'C1621363'] },
      () => {
        // #1 Click "Orders" in the Settings navigation list
        SettingsMenu.selectOrders();
        OrderEmailTemplates.verifyOrdersSettingsGeneralOption();

        // #2 Click "Order email templates" in the "General" group
        SettingOrdersNavigationMenu.selectOrderEmailTemplates();
        OrderEmailTemplates.waitLoading();
        OrderEmailTemplates.verifyNewButtonExists();
        OrderEmailTemplates.verifyTemplatesListed(
          testData.emailTemplates.map((emailTemplate) => emailTemplate.name),
        );
      },
    );
  });
});
