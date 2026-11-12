import Permissions from '../../../support/dictionary/permissions';
import OrderEmailTemplates from '../../../support/fragments/settings/orders/orderEmailTemplates';
import SettingOrdersNavigationMenu from '../../../support/fragments/settings/orders/settingOrdersNavigationMenu';
import SettingsOrders from '../../../support/fragments/settings/orders/settingsOrders';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import Users from '../../../support/fragments/users/users';

describe('Orders', () => {
  describe('Settings (Orders)', () => {
    describe('Order email templates', () => {
      const ordersSettingsItems = [
        'Approvals',
        'Closing purchase order reasons',
        'Order templates',
        'Order template categories',
        'Order email templates',
        'Purchase order lines limit',
        'Opening purchase orders',
        'Acquisition methods',
        'Custom Fields - Purchase Orders',
        'Custom Fields - Purchase Order Lines',
        'Number generator options',
      ];
      const mainTemplate = OrderEmailTemplates.getDefaultOrderEmailTemplate();
      const otherTemplates = [
        OrderEmailTemplates.getDefaultOrderEmailTemplate(),
        OrderEmailTemplates.getDefaultOrderEmailTemplate(),
      ];
      const allTemplates = [mainTemplate, ...otherTemplates];
      const testData = { user: {} };

      before('Create test data', () => {
        cy.getAdminToken();
        allTemplates.forEach((template) => {
          OrderEmailTemplates.createOrderEmailTemplateViaApi(template);
        });

        cy.createTempUser([Permissions.uiSettingsOrdersCanViewAllSettings.gui]).then(
          (userProperties) => {
            testData.user = userProperties;

            cy.login(testData.user.username, testData.user.password, {
              path: SettingsMenu.ordersPath,
              waiter: SettingsOrders.waitLoadingOrderSettings,
            });
          },
        );
      });

      after('Delete test data', () => {
        cy.getAdminToken();
        allTemplates.forEach((template) => {
          OrderEmailTemplates.deleteOrderEmailTemplateViaApi(template.id);
        });
        Users.deleteViaApi(testData.user.userId);
      });

      it(
        'C1621370 View an order email template\'s detail pane and Actions menu from "Settings" > "Orders" (dresden)',
        { tags: ['extendedPath', 'dresden', 'C1621370'] },
        () => {
          // #1 Navigate to "Settings" > "Orders"
          OrderEmailTemplates.verifyOrdersSettingsNavList(ordersSettingsItems);

          // #2 Click "Order email templates"
          SettingOrdersNavigationMenu.selectOrderEmailTemplates();
          OrderEmailTemplates.waitLoading();
          OrderEmailTemplates.verifyListPane(allTemplates.map(({ name }) => name));

          // #3 Click "Bestellung Mono Kauf" in the list
          OrderEmailTemplates.selectTemplate(mainTemplate.name);
          OrderEmailTemplates.verifyGeneralInformation(mainTemplate.name, {
            name: mainTemplate.name,
            active: mainTemplate.active,
            description: mainTemplate.description,
          });

          // #4 Verify the "Template content" accordion on the detail pane
          OrderEmailTemplates.verifyTemplateContent(mainTemplate.name, {
            subject: mainTemplate.localizedTemplates.en.header,
            bodyTokens: ['{{organization.name}}', '{{#orders}}', '{{/orders}}'],
          });

          // #5 Click "Actions" button on the "Bestellung Mono Kauf" detail pane
          OrderEmailTemplates.openActionsMenu(mainTemplate.name);
          OrderEmailTemplates.verifyActionsMenu(['Duplicate', 'Edit', 'Delete']);
        },
      );
    });
  });
});
