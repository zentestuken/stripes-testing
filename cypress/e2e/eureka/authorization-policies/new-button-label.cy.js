import Users from '../../../support/fragments/users/users';
import TopMenu from '../../../support/fragments/topMenu';
import getRandomPostfix from '../../../support/utils/stringTools';
import AuthorizationPolicies from '../../../support/fragments/settings/authorization-policies/authorizationPolicies';
import CapabilitySets from '../../../support/dictionary/capabilitySets';
import {
  AUTHORIZATION_POLICY_TYPES,
  AUTHORIZATION_POLICY_SOURCES,
} from '../../../support/constants';

describe('Eureka', () => {
  describe('Settings', () => {
    describe('Authorization policies', () => {
      const testData = {
        policyName: `AT_C1621435_AuthPolicy_${getRandomPostfix()}`,
        policyDescription: 'Test policy description',
      };
      const policyBody = {
        name: testData.policyName,
        description: testData.policyDescription,
        type: AUTHORIZATION_POLICY_TYPES.TIME.toUpperCase(),
        timePolicy: {
          repeat: false,
          start: `${new Date().getFullYear()}-01-01T00:00:00Z`,
          expires: `${new Date().getFullYear() + 1}-12-01T00:00:00Z`,
          dayOfMonthStart: 5,
          dayOfMonthEnd: 20,
          monthStart: 1,
          monthEnd: 12,
          hourStart: 8,
          hourEnd: 17,
          minuteStart: 0,
          minuteEnd: 30,
        },
        source: AUTHORIZATION_POLICY_SOURCES.USER,
      };

      const capabSetsToAssign = [CapabilitySets.uiAuthorizationPoliciesSettingsAdmin];

      before('Create user, policy, login', () => {
        cy.getAdminToken();
        cy.createAuthorizationPolicyApi(policyBody).then((response) => {
          expect(response.status).to.eq(201);
          testData.policyId = response.body.id;
        });
        cy.createTempUser([]).then((createdUserProperties) => {
          testData.user = createdUserProperties;
          cy.assignCapabilitiesToExistingUser(testData.user.userId, [], capabSetsToAssign);
          if (Cypress.env('runAsAdmin')) cy.updateRolesForUserApi(testData.user.userId, []);
          cy.waitForAuthRefresh(() => {
            cy.login(testData.user.username, testData.user.password, {
              path: TopMenu.settingsAuthorizationPolicies,
              waiter: AuthorizationPolicies.waitContentLoading,
            });
          });
        });
      });

      after('Delete user, policy', () => {
        cy.getAdminToken();
        Users.deleteViaApi(testData.user.userId);
        cy.deleteAuthorizationPolicyApi(testData.policyId);
      });

      it(
        'C1621435 "New" button on Authorization policies pane reads "New" (not "+ New") (eureka)',
        { tags: ['extendedPath', 'eureka', 'C1621435'] },
        () => {
          // #1 Observe the header of the "Authorization policies" pane
          AuthorizationPolicies.searchPolicy(testData.policyName);
          AuthorizationPolicies.checkPolicyFound(testData.policyName);
          AuthorizationPolicies.verifyNewButtonLabelWithoutPlus();

          // #2 Click on `<policy name>` in the list
          AuthorizationPolicies.clickOnPolicyName(testData.policyName);
          AuthorizationPolicies.verifyPolicyViewPane(
            testData.policyName,
            testData.policyDescription,
          );

          // #3 Close the policy detail pane
          AuthorizationPolicies.closePolicyDetailView(testData.policyName);
          AuthorizationPolicies.verifyNewButtonLabelWithoutPlus();
        },
      );
    });
  });
});
