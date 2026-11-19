/* ==========================================================================
   LEAD FORM SETTINGS — this is the only file you need to edit to go live.
   --------------------------------------------------------------------------
   Right now the form is in PREVIEW MODE: it checks the answers and shows a
   success message, but nothing is sent anywhere. That's on purpose, so you can
   click through the pages safely.

   To connect it to GoHighLevel, paste your webhook URL between the quotes on
   the endpoint line below. Step-by-step instructions: GOHIGHLEVEL.md
   ========================================================================== */

window.RPV_FORM_CONFIG = {

  /* 1. PASTE YOUR GOHIGHLEVEL INBOUND WEBHOOK URL HERE.
        Leave it empty ("") to stay in preview mode.                        */
  endpoint: "",

  /* 2. Where to send people after they submit.
        Leave empty ("") to show the thank-you message on the same page.    */
  redirectTo: "",

  /* 3. The thank-you message shown when there's no redirect.               */
  successTitle: "You're on the list.",
  successBody:  "We've got your details. Someone from Reservoir will reach out within one business day — usually much sooner.",

  /* 4. Shown if the send fails.                                            */
  errorBody: "That didn't go through. Please try again, or call us at (555) 010-0199."
};
