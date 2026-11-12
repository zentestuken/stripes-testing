import uuid from 'uuid';

import { Button, NavListItem, Pane } from '../../../../../interactors';
import getRandomPostfix from '../../../utils/stringTools';

const EMAIL_TEMPLATES_SCOPE = 'orders-email';
const EMAIL_TEMPLATES_TITLE = 'Order email templates';

const ordersSettingsPane = Pane('Orders');
const emailTemplatesPane = Pane(EMAIL_TEMPLATES_TITLE);

export default {
  getDefaultOrderEmailTemplate({ additionalProperties = {} } = {}) {
    const postfix = getRandomPostfix();

    return {
      id: uuid(),
      active: true,
      description: `autotest_email_template_description_${postfix}`,
      localizedTemplates: {
        en: {
          header: `autotest_email_subject_${postfix}`,
          body: `<p>autotest_email_body_${postfix}</p>`,
        },
      },
      name: `autotest_email_template_${postfix}`,
      outputFormats: ['text/html'],
      scope: EMAIL_TEMPLATES_SCOPE,
      templateResolver: 'handlebars',
      ...additionalProperties,
    };
  },

  createOrderEmailTemplateViaApi(emailTemplate) {
    return cy
      .okapiRequest({
        method: 'POST',
        path: 'templates',
        body: emailTemplate,
        isDefaultSearchParamsRequired: false,
      })
      .then(({ body }) => body);
  },

  deleteOrderEmailTemplateViaApi(emailTemplateId, { failOnStatusCode = false } = {}) {
    return cy.okapiRequest({
      method: 'DELETE',
      path: `templates/${emailTemplateId}`,
      isDefaultSearchParamsRequired: false,
      failOnStatusCode,
    });
  },

  verifyOrdersSettingsGeneralOption() {
    cy.expect([
      ordersSettingsPane.exists(),
      ordersSettingsPane.find(NavListItem(EMAIL_TEMPLATES_TITLE)).exists(),
    ]);
  },

  waitLoading() {
    cy.expect(emailTemplatesPane.exists());
  },

  verifyNewButtonExists() {
    cy.expect(emailTemplatesPane.find(Button('New')).exists());
  },

  verifyTemplateListed(templateName) {
    cy.expect(emailTemplatesPane.find(NavListItem(templateName)).exists());
  },

  verifyTemplatesListed(templateNames) {
    templateNames.forEach((templateName) => this.verifyTemplateListed(templateName));
  },
};
