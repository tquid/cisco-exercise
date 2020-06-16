# cisco-exercise
A homework assignment for Neil.

# Using this code

## Stuff to install

You will need several software pre-requisites:

1. Pulumi. Install from this link: https://www.pulumi.com/docs/get-started/install/. You will also need to create an account at https://app.pulumi.com. I suggest using your Github account. If you don't want to create yet another account, you can use `pulumi login file://~` to manage state locally.
2. AWS CLI. Installation instructions: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html.
3. Node.js. `snap install --classic --channel=14` will get the LTS version if you have snap installed. Otherwise check the directions at https://nodejs.org/en/download/ for whichever platform and method you prefer.

## AWS setup

You will need an AWS user with programmatic access to create instances, security groups, VPCs, routes, route tables, and subnets. Instructions for setting up here: https://www.pulumi.com/docs/intro/cloud-providers/aws/setup/

You will particularly need an AWS keypair for ssh connection, which if you don't have one, can be set following these directions: https://docs.aws.amazon.com/cli/latest/userguide/cli-services-ec2-keypairs.html#creating-a-key-pair.

## Running the install

1. From the repo directory, run `npm install` to set up npm dependencies.
2. Run commands to set up for your network and cloud preferences:
    ```
    pulumi config set aws:region <Your AWS region, e.g. ca-central-1>
    pulumi config set myAz <AZ to use for your instances, e.g. ca-central-1a>
    pulumi config set myCidr <Your CIDR that you will connect from, e.g. 99.53.28.199/32>
    pulumi config set mySshKey <An ssh key pair name from AWS to use>
    ```
3. Run `pulumi up`.
4. Select "yes" in the interactive interface that comes up.
5. Note the **Outputs** section with the IP addresses and URN (Pulumi's identifier for a resource). I find it easiest to use a separate terminal for any testing, leavin the Outputs information accessible for copying & pasting.
6. Test the webserver by using `curl` or your browser of choice. It may take a few minutes to come up.
7. Once testing is done, delete the outbound security group rule with `pulumi destroy -t <webToWorldUrn value from outputs>`
8. Perform any other tests to verify the network is set up as desired.
9. When done, use `pulumi destroy` to remove the resources.
