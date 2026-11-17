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
        existingRoleName: `AT_C1621434_ExistingRole_${getRandomPostfix()}`,
        roleType: 'Regular',
      };

      const capabSetsToAssign = [
        CapabilitySets.uiAuthorizationRolesSettingsView,
        CapabilitySets.uiAuthorizationRolesSettingsCreate,
      ];

      before('Create user, login', () => {
        cy.getAdminToken();
        cy.createTempUser([]).then((createdUserProperties) => {
          testData.user = createdUserProperties;
          cy.assignCapabilitiesToExistingUser(testData.user.userId, [], capabSetsToAssign);
          if (Cypress.env('runAsAdmin')) cy.updateRolesForUserApi(testData.user.userId, []);
          cy.createAuthorizationRoleApi(testData.existingRoleName).then((role) => {
            testData.existingRoleId = role.id;
          });
          cy.waitForAuthRefresh(() => {
            cy.login(testData.user.username, testData.user.password, {
              path: TopMenu.settingsAuthorizationRoles,
              waiter: AuthorizationRoles.waitContentLoading,
            });
          });
        });
      });

      after('Delete user, roles', () => {
        cy.getAdminToken();
        Users.deleteViaApi(testData.user.userId);
        cy.deleteAuthorizationRoleApi(testData.existingRoleId, true);
        cy.deleteAuthorizationRoleApi(testData.roleId, true);
      });

      it(
        'C1621434 "New" button on Authorization roles pane reads "New" (not "+ New"); role creation is unaffected (eureka)',
        { tags: ['extendedPath', 'eureka', 'C1621434'] },
        () => {
          // #1 Observe the header of the "Authorization roles" pane
          AuthorizationRoles.checkRoleFound(testData.existingRoleName);
          AuthorizationRoles.verifyNewButtonLabelWithoutPlus();

          // #2 Click the "New" button
          AuthorizationRoles.clickNewButton();
          AuthorizationRoles.verifyNameDescriptionInEditForm('');

          // #3 Enter a unique value in the "Name*" field, then click "Save & close"
          AuthorizationRoles.fillRoleNameDescription(testData.roleName);
          cy.intercept('POST', '/roles*').as('createRole');
          AuthorizationRoles.clickSaveButton();
          cy.wait('@createRole').then((call) => {
            testData.roleId = call.response.body.id;
            expect(call.response.body.name).to.eq(testData.roleName);
          });
          AuthorizationRoles.checkAfterSaveCreate(testData.roleName);
          AuthorizationRoles.checkRoleFound(testData.roleName);

          // #4 Observe the header of the "Authorization roles" pane again
          AuthorizationRoles.verifyNewButtonLabelWithoutPlus();

          // #5 Click on the created role in the list
          AuthorizationRoles.clickOnRoleName(testData.roleName);
          AuthorizationRoles.verifyRoleViewPane(testData.roleName);
          AuthorizationRoles.verifyRoleType(testData.roleName, testData.roleType);
          AuthorizationRoles.checkActionsButtonShown(true, testData.roleName);
        },
      );
    });
  });
});
