import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";

// Below code based off the tutorial at https://www.pulumi.com/docs/tutorials/aws/ec2-webserver/

const size = "t2.micro";     // t2.micro is available in the AWS free tier
const ami = pulumi.output(aws.getAmi({
    filters: [{
        name: "name",
        values: ["amzn-ami-hvm-*"],
    }],
    owners: ["137112412989"], // This owner ID is Amazon
    mostRecent: true,
}));

// Time for network goodies
const vpc = new awsx.ec2.Vpc("custom", {
    subnets: [{
        type: "public",
        name: "subnet-www",
    },
    {
        type: "public",
        name: "subnet-bastion",
    },
    {
        type: "isolated",
        name: "subnet-app",
    }]
});

const bastion_group = new aws.ec2.SecurityGroup("bastion-secgrp", {
    // Repalce cidrBlocks with your own IP or CIDR range
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["174.6.14.57/32"] },
    ],
    vpcId: vpc.id,
});

const www_group = new aws.ec2.SecurityGroup("webserver-secgrp", {
    ingress: [{
        protocol: "tcp",
        securityGroups: [bastion_group.name],
        fromPort: -1,
        toPort: 22
    }],
    vpcId: vpc.id,
});

const app_group = new aws.ec2.SecurityGroup("appserver-secgrp", {
    ingress: [{
        protocol: "tcp",
        securityGroups: [www_group.name],
        fromPort: -1,
        toPort: 80
    },
    {
        protocol: "tcp",
        securityGroups: [bastion_group.name],
        fromPort: -1,
        toPort: 22
    }],
    egress: [], // No backsies on the www_group!
    vpcId: vpc.id,
});

// Use this to avoid a circular reference
const www_to_app = new aws.ec2.SecurityGroupRule("www-to-app", {
    type: "egress",
    protocol: "tcp",
    fromPort: -1,
    toPort: 80,
    securityGroupId: www_group.name,
});

const userData = 
`#!/bin/bash
sudo yum update -y
sudo yum install -y httpd24
sudo yum install -y curl`;

const webserver = new aws.ec2.Instance("webserver-www", {
    instanceType: size,
    securityGroups: [www_group.name], // reference the security group resource above
    ami: ami.id,
    userData: userData,
    vpcSecurityGroupIds: [www_group.name],
});

const appserver = new aws.ec2.Instance("appserver", {
    instanceType: size,
    securityGroups: [app_group.name],
    ami: ami.id,
    userData: userData,
});

const bastion = new aws.ec2.Instance("bastion", {
    instanceType: size,
    securityGroups: [bastion_group.name],
    ami: ami.id,
    userData: userData,
});

export const WebserverPublicIp = webserver.publicIp;
export const WebserverPublicHostName = webserver.publicDns;

