import Users from '../../../support/fragments/users/users';
import UsersCard from '../../../support/fragments/users/usersCard';
import UserEdit from '../../../support/fragments/users/userEdit';
import UsersSearchPane from '../../../support/fragments/users/usersSearchPane';
import TopMenu from '../../../support/fragments/topMenu';
import getRandomPostfix from '../../../support/utils/stringTools';
import CapabilitySets from '../../../support/dictionary/capabilitySets';

describe('Eureka', () => {
  describe('Users', () => {
    const testData = {
      roleAName: `AT_C1621415_UserRole_A_${getRandomPostfix()}`,
    };

    const userInfoAccordion = 'User information';
    const contactInfoAccordion = 'Contact information';
    const userRolesAccordion = 'User roles';

    const capabSetsToAssign = [
      CapabilitySets.uiUsersView,
      CapabilitySets.uiUsersEdit,
      CapabilitySets.uiAuthorizationRolesUsersSettingsView,
    ];

    before('Create users, role', () => {
      cy.getAdminToken();
      cy.createAuthorizationRoleApi(testData.roleAName).then((role) => {
        testData.roleAId = role.id;
      });
      // Precondition #2: "Staff" type target user (default for createTempUser)
      cy.createTempUser([]).then((targetUserProperties) => {
        testData.targetUser = targetUserProperties;
      });
      // Precondition #3: restricted-view user with only the listed capability sets
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
      // Precondition #4: restricted-view user is on the main page of the Users app
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
      'C1621415 "User roles" accordion is shown read-only in Users app View and Edit forms for a user granted only the "Authorization Roles Users Settings - View" capability (eureka)',
      { tags: ['extendedPath', 'eureka', 'C1621415'] },
      () => {
        // #1 Search for "Target user" by username, open the "Target user" record
        UsersSearchPane.searchByUsername(testData.targetUser.username);
        UsersSearchPane.selectUserFromList(testData.targetUser.username);
        UsersCard.verifyUserCardOpened();
        UsersCard.verifyAccordionsPresent([
          userInfoAccordion,
          contactInfoAccordion,
          userRolesAccordion,
        ]);
        UsersCard.verifyUserRolesAccordionState({ isOpen: false });

        // #2 Expand the "User roles" accordion in the detail view
        UsersCard.clickUserRolesAccordion();
        UsersCard.verifyUserRoleNames([testData.roleAName]);

        // #3 Click the "Actions" menu on the detail view and select "Edit"
        UserEdit.openEdit();
        UserEdit.checkUserEditPaneOpened();
        UserEdit.verifyUserRolesAccordionState({ isOpen: false });

        // #4 Expand the "User roles" accordion in the Edit form
        UserEdit.clickUserRolesAccordion(true, false);
        UserEdit.verifyUserRoleNames([testData.roleAName], false);

        // #5 Click "Cancel" to close the Edit form without saving changes
        UserEdit.cancelEdit();
        UserEdit.checkUserEditPaneOpened(false);
        UsersCard.verifyUserCardOpened();
        UsersCard.verifyUserRolesAccordionState();

        // #6 Refresh the browser page while on the detail view
        cy.reload();
        UsersCard.verifyUserCardOpened();
        UsersCard.verifyUserRolesAccordionState();
      },
    );
  });
});
