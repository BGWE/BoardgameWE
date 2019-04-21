const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendResetPasswordEmail = (toAddress, fromAddress, fromName, first_name, link) => {
    const msg = {
        to: toAddress,
        from: {
            email: fromAddress,
            name: fromName
        },
        subject: 'Hello world',
        text: 'Hello plain world!',
        html: '<p>Hello HTML world!</p>',
        templateId: 'd-9d79c66908aa491c80db50a0f3ea4193',
        dynamic_template_data: {
            user: {
                first_name: first_name
            },
            link: link
        }
    };
    
    return sgMail.send(msg);
};

