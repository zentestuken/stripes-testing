import Users from '../../../support/fragments/users/users';
import TopMenu from '../../../support/fragments/topMenu';
import getRandomPostfix from '../../../support/utils/stringTools';
import AuthorizationRoles from '../../../support/fragments/settings/authorization-roles/authorizationRoles';
import CapabilitySets from '../../../support/dictionary/capabilitySets';

describe('Eureka', () => {
  describe('Settings', () => {
    describe('Authorization roles', () => {
      const testData = {
        roleName: `AT_C1621434_UserRole_${getRandomPostfix()}`,
        roleType: 'Regular',
      };

      const capabSetsToAssign = [
        CapabilitySets.uiAuthorizationRolesSettingsView,
        CapabilitySets.uiAuthorizationRolesSettingsCreate,
      ];

      before('Creating user, login', () => {
        cy.createTempUser([]).then((createdUserProperties) => {
          testData.user = createdUserProperties;
          cy.assignCapabilitiesToExistingUser(testData.user.userId, [], capabSetsToAssign);
          if (Cypress.env('runAsAdmin')) cy.updateRolesForUserApi(testData.user.userId, []);
          cy.waitForAuthRefresh(() => {
            cy.login(testData.user.username, testData.user.password, {
              path: TopMenu.settingsAuthorizationRoles,
              waiter: AuthorizationRoles.waitContentLoading,
            });
          });
        });
      });

      after('Deleting user, role', () => {
        cy.getAdminToken();
        Users.deleteViaApi(testData.user.userId);
        cy.getUserRoleIdByNameApi(testData.roleName).then((roleId) => {
          cy.deleteAuthorizationRoleApi(roleId, true);
        });
      });

      it(
        'C1621434 "New" button on Authorization roles pane reads "New" (not "+ New"); role creation is unaffected (eureka)',
        { tags: ['extendedPath', 'eureka', 'C1621434'] },
        () => {
          // #1 Observe the header of the "Authorization roles" pane
          AuthorizationRoles.waitContentLoading();
          AuthorizationRoles.checkNewButtonShown();
          AuthorizationRoles.verifyNewButtonLabel();

          // #2 Click the "New" button
          AuthorizationRoles.clickNewButton();

          // #3 Enter a unique value in the "Name*" field, then click "Save & close"
          AuthorizationRoles.fillRoleNameDescription(testData.roleName);
          AuthorizationRoles.clickSaveButton();
          AuthorizationRoles.checkAfterSaveCreate(testData.roleName);

          // #4 Observe the header of the "Authorization roles" pane again
          AuthorizationRoles.verifyNewButtonLabel();

          // #5 Click on the role name in the list
          AuthorizationRoles.clickOnRoleName(testData.roleName);
          AuthorizationRoles.verifyRoleViewPane(testData.roleName);
          AuthorizationRoles.verifyRoleType(testData.roleName, testData.roleType);
          AuthorizationRoles.verifyActionsButtonInRoleView(testData.roleName);
        },
      );
    });
  });
});
