import Permissions from '../../../support/dictionary/permissions';
import OrderEmailTemplates from '../../../support/fragments/settings/orders/orderEmailTemplates';
import SettingOrdersNavigationMenu from '../../../support/fragments/settings/orders/settingOrdersNavigationMenu';
import SettingsOrders from '../../../support/fragments/settings/orders/settingsOrders';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import Users from '../../../support/fragments/users/users';
import getRandomPostfix from '../../../support/utils/stringTools';

describe('Orders', () => {
  describe('Settings (Orders)', () => {
    describe('Order email templates', () => {
      const randomPostfix = getRandomPostfix();
      const template = OrderEmailTemplates.getDefaultOrderEmailTemplate({
        name: `AT_C1621371_Template_${randomPostfix}`,
        description: `AT_C1621371_description_${randomPostfix}`,
      });
      const testData = { user: {} };

      before('Create test data', () => {
        cy.getAdminToken();
        OrderEmailTemplates.createOrderEmailTemplateViaApi(template);

        cy.createTempUser([Permissions.uiSettingsOrdersCanViewAndEditAllSettings.gui]).then(
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
        OrderEmailTemplates.deleteOrderEmailTemplateViaApi(template.id);
        Users.deleteViaApi(testData.user.userId);
      });

      it(
        'C1621371 Cancel then confirm deletion of an order email template (dresden)',
        { tags: ['extendedPath', 'dresden', 'C1621371'] },
        () => {
          SettingOrdersNavigationMenu.selectOrderEmailTemplates();
          OrderEmailTemplates.waitLoading();
          OrderEmailTemplates.selectTemplate(template.name);

          // #1 Click "Actions" button, then select "Delete"
          OrderEmailTemplates.openDeleteModal(template.name);

          // #2 Click "Cancel" button on the "Delete Order email template" dialog
          OrderEmailTemplates.cancelDeletion(template.name);

          // #3 Click "Actions" button, then select "Delete" again
          OrderEmailTemplates.openDeleteModal(template.name);

          // #4 Click "Delete" button on the "Delete Order email template" dialog
          OrderEmailTemplates.confirmDeletion(template.name);
        },
      );
    });
  });
});
