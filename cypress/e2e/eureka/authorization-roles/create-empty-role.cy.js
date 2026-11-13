import Users from '../../../support/fragments/users/users';
import TopMenu from '../../../support/fragments/topMenu';
import getRandomPostfix from '../../../support/utils/stringTools';
import AuthorizationRoles from '../../../support/fragments/settings/authorization-roles/authorizationRoles';
import Capabilities from '../../../support/dictionary/capabilities';
import CapabilitySets from '../../../support/dictionary/capabilitySets';

describe('Eureka', () => {
  describe('Settings', () => {
    describe('Authorization roles', () => {
      const testData = {
        roleName: `AT_C423999_UserRole_${getRandomPostfix()}`,
        roleDescription: `Description ${getRandomPostfix()}`,
      };

      const capabSetsToAssign = [
        CapabilitySets.uiAuthorizationRolesSettingsAdmin,
        CapabilitySets.capabilities,
        CapabilitySets.roleCapabilitySets,
      ];
      const capabsToAssign = [Capabilities.settingsEnabled];

      before(() => {
        cy.createTempUser([]).then((createdUserProperties) => {
          testData.user = createdUserProperties;
          cy.assignCapabilitiesToExistingUser(
            testData.user.userId,
            capabsToAssign,
            capabSetsToAssign,
          );
          if (Cypress.env('runAsAdmin')) cy.updateRolesForUserApi(testData.user.userId, []);
          cy.login(testData.user.username, testData.user.password, {
            path: TopMenu.settingsAuthorizationRoles,
            waiter: AuthorizationRoles.waitContentLoading,
          });
        });
      });

      afterEach(() => {
        cy.getAdminToken();
        Users.deleteViaApi(testData.user.userId);
        cy.deleteAuthorizationRoleApi(testData.roleId, true);
      });

      it(
        'C423999 Creating new authorization role (only name/description specified) (eureka)',
        { tags: ['criticalPath', 'eureka', 'eurekaPhase1', 'C423999'] },
        () => {
          // #1 Go to "Settings" app → Select "Authorization roles" option in "Settings" pane
          AuthorizationRoles.waitContentLoading();

          // #2 Click on "+ New" button in second pane
          AuthorizationRoles.clickNewButton();
          AuthorizationRoles.verifyEmptyCapabilitiesAccordion();
          AuthorizationRoles.verifyEmptyCapabilitySetsAccordion();
          AuthorizationRoles.checkSaveButton(false);

          // #3 Fill "Name" input field with any value
          // #4 Fill "Description" input field with any value
          AuthorizationRoles.fillRoleNameDescription(testData.roleName, testData.roleDescription);
          AuthorizationRoles.checkSaveButton(true);

          // #5 Open browser DevTools → Network tab (requests are tracked via intercepts)
          cy.intercept('POST', '/roles*').as('roles');
          cy.intercept('POST', '/roles/capability-sets*').as('capabilitySets');
          cy.intercept('POST', '/roles/capabilities*').as('capabilities');

          // #6 Click on "Save & close" button
          AuthorizationRoles.clickSaveButton();

          // #7 Verify POST /roles is successful; capabilities / capability-sets requests are NOT sent
          cy.wait('@roles').then(({ request, response }) => {
            expect(request.body.name).to.eq(testData.roleName);
            expect(request.body.description).to.eq(testData.roleDescription);
            expect(response.body.name).to.eq(testData.roleName);
            expect(response.body.description).to.eq(testData.roleDescription);
            expect(response.body.id).to.exist;
            testData.roleId = response.body.id;
            cy.wait(2000);
            cy.get('@capabilitySets.all').then((calls) => {
              expect(calls).to.have.length(0);
            });
            cy.get('@capabilities.all').then((calls) => {
              expect(calls).to.have.length(0);
            });
          });
          AuthorizationRoles.checkAfterSaveCreate(testData.roleName, testData.roleDescription);

          // #8 Select created role name in second pane
          AuthorizationRoles.clickOnRoleName(testData.roleName);

          // #9 Click on "Capabilities" and "Capability sets" accordion headers
          AuthorizationRoles.clickOnCapabilitySetsAccordion(false);
          AuthorizationRoles.clickOnCapabilitiesAccordion(false);
          AuthorizationRoles.verifyEmptyCapabilitiesAccordion();
          AuthorizationRoles.verifyEmptyCapabilitySetsAccordion();
        },
      );
    });
  });
});
