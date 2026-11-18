import Users from '../../../support/fragments/users/users';
import UsersCard from '../../../support/fragments/users/usersCard';
import UserEdit from '../../../support/fragments/users/userEdit';
import UsersSearchPane from '../../../support/fragments/users/usersSearchPane';
import TopMenu from '../../../support/fragments/topMenu';
import getRandomPostfix from '../../../support/utils/stringTools';
import CapabilitySets from '../../../support/dictionary/capabilitySets';

describe('Eureka', () => {
  describe('Users', () => {
    const randomPostfix = getRandomPostfix();
    const testData = {
      roleAName: `AT_C1621416_UserRole_A_${randomPostfix}`,
      newPreferredFirstName: `AT_C1621416_PrefName_${randomPostfix}`,
    };

    const userInfoAccordion = 'User information';
    const contactInfoAccordion = 'Contact information';
    const userRolesAccordion = 'User roles';

    const capabSetsToAssign = [CapabilitySets.uiUsersView, CapabilitySets.uiUsersEdit];

    before('Create users, role', () => {
      cy.getAdminToken();
      cy.createAuthorizationRoleApi(testData.roleAName).then((role) => {
        testData.roleAId = role.id;
      });
      // Precondition #2: "Staff" type target user (default for createTempUser)
      cy.createTempUser([]).then((targetUserProperties) => {
        testData.targetUser = targetUserProperties;
      });
      // Precondition #3: restricted user with only the listed capability sets (no role-related ones)
      cy.createTempUser([]).then((restrictedUserProperties) => {
        testData.restrictedUser = restrictedUserProperties;
        cy.assignCapabilitiesToExistingUser(testData.restrictedUser.userId, [], capabSetsToAssign);
        if (Cypress.env('runAsAdmin')) cy.updateRolesForUserApi(testData.restrictedUser.userId, []);
      });
    });

    before('Assign role to target user, login', () => {
      cy.getAdminToken();
      if (Cypress.env('runAsAdmin')) {
        cy.updateRolesForUserApi(testData.targetUser.userId, [testData.roleAId]);
      } else {
        cy.addRolesToNewUserApi(testData.targetUser.userId, [testData.roleAId]);
      }
      // Precondition #5: restricted user is on the main page of the Users app
      cy.login(testData.restrictedUser.username, testData.restrictedUser.password, {
        path: TopMenu.usersPath,
        waiter: Users.waitLoading,
      });
    });

    after('Delete role, users', () => {
      cy.getAdminToken();
      cy.deleteAuthorizationRoleApi(testData.roleAId);
      Users.deleteViaApi(testData.targetUser.userId);
      Users.deleteViaApi(testData.restrictedUser.userId);
    });

    it(
      'C1621416 "User roles" accordion is hidden in Users app for a user without "Authorization Roles Users Settings" capability, and editing the user keeps its role assignments (eureka)',
      { tags: ['extendedPath', 'eureka', 'C1621416'] },
      () => {
        // #1 Search for "Target user" by username, open the "Target user" record
        UsersSearchPane.searchByUsername(testData.targetUser.username);
        UsersSearchPane.selectUserFromList(testData.targetUser.username);
        UsersCard.verifyUserCardOpened();
        UsersCard.verifyAccordionsPresent([userInfoAccordion, contactInfoAccordion]);
        UsersCard.verifyUserRolesAccordionState({ isShown: false });
        UsersCard.verifyAccordionsAbsent([userRolesAccordion]);

        // #2 Click the "Actions" menu on the detail view and select "Edit"
        UserEdit.openEdit();
        UserEdit.checkUserEditPaneOpened();
        UserEdit.verifyAccordionsPresent([userInfoAccordion, contactInfoAccordion]);
        UserEdit.verifyUserRolesAccordionState({ isShown: false });

        // #3 Update the "Preferred first name" field and click "Save & close"
        UserEdit.changePreferredFirstName(testData.newPreferredFirstName);
        UserEdit.saveEditedUser();
        UserEdit.checkUserEditPaneOpened(false);
        UsersCard.verifyUserCardOpened();
        Users.verifyPreferredfirstnameOnUserDetailsPane(testData.newPreferredFirstName);
        UsersCard.verifyUserRolesAccordionState({ isShown: false });

        // #4 Click the "Actions" menu on the detail view and select "Edit"
        UserEdit.openEdit();
        UserEdit.checkUserEditPaneOpened();
        UserEdit.verifyUserRolesAccordionState({ isShown: false });

        // #5 Click "Cancel" to close the Edit form
        UserEdit.cancelEdit();
        UserEdit.checkUserEditPaneOpened(false);
        UsersCard.verifyUserCardOpened();

        // #6 Send GET /roles/users?query=userId==<Target user UUID> as an administrator
        cy.getAdminToken();
        cy.getAuthorizationRolesForUserApi(testData.targetUser.userId).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.userRoles).to.have.length(1);
          expect(response.body.userRoles[0].userId).to.eq(testData.targetUser.userId);
          expect(response.body.userRoles[0].roleId).to.eq(testData.roleAId);
        });
      },
    );
  });
});
