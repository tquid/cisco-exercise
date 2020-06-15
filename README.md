# cisco-exercise
A homework assignment for Neil.

# Using this code

## Stuff to install

You will need several software pre-requisites:

1. Pulumi. Install from this link: https://www.pulumi.com/docs/get-started/install/. You will also need to create an account at https://app.pulumi.com. I suggest using your Github account. If you don't want to create yet another account, you can use `pulumi login file://~` to manage state locally.
2. AWS CLI. Installation instructions: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html.
3. Node.js. `snap install --classic --channel=14` will get the LTS version if you have snap installed. Otherwise check the directions at https://nodejs.org/en/download/ for whichever platform and method you prefer.

## AWS setup

You will need an AWS user with programmatic access to create instances, security groups, VPCs, routes, route tables, and subnets. You will also need 
## Running the install

1. From the repo directory, run `npm install` to set up npm dependencies.
2. 

pulumi config set aws:region ca-central-1
