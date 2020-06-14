import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

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

const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

const web_subnet = new aws.ec2.Subnet("subnet-web", {
    cidrBlock: "10.0.0.0/24",
    tags: {
        Name: "subnet-web",
    },
    vpcId: vpc.id,
    availabilityZone: "ca-central-1a"
});

const bastion_subnet = new aws.ec2.Subnet("subnet-bastion", {
    cidrBlock: "10.0.1.0/24",
    tags: {
        Name: "subnet-bastion",
    },
    vpcId: vpc.id,
    availabilityZone: "ca-central-1a"
});

const app_subnet = new aws.ec2.Subnet("subnet-app", {
    cidrBlock: "10.0.2.0/24",
    tags: {
        Name: "subnet-app",
    },
    vpcId: vpc.id,
    availabilityZone: "ca-central-1a"
});

const igw = new aws.ec2.InternetGateway("igw", {
    tags: {
        Name: "igw",
    },
    vpcId: vpc.id,
});

const bastion_rt = new aws.ec2.RouteTable("bastion-route", {
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
    vpcId: vpc.id,
});

const bastion_rt_assoc = new aws.ec2.RouteTableAssociation("bastion-rt-assoc", {
    subnetId: bastion_subnet.id,
    routeTableId: bastion_rt.id,
});



// const web_route = new aws.ec2.RouteTable("web-route", {
//     routes: [{
//         cidrBlock: "0.0.0.0/0",
//         gatewayId: igw.id,
//     }],
//     vpcId: vpc.id,
// });

// const web_rt_assoc = new aws.ec2.RouteTableAssociation("web-rt-assoc", {
//     subnetId: web_subnet.id,
//     routeTableId: web_route.id,
// });

const bastion_group = new aws.ec2.SecurityGroup("bastion", {
    // Repalce cidrBlocks with your own IP or CIDR range
    ingress: [{ 
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["174.6.14.57/32"]},
    ],
    vpcId: vpc.id,
    tags: {
        Name: "sg_bastion",
    },
});

// Rules are after app_group because of circular reference
const web_group = new aws.ec2.SecurityGroup("webserver", {
    vpcId: vpc.id,
    tags: {
        Name: "sg_webserver",
    },
});

const app_group = new aws.ec2.SecurityGroup("appserver", {
    ingress: [{
        protocol: "tcp",
        securityGroups: [web_group.id],
        fromPort: 80,
        toPort: 80
    },
    {
        protocol: "tcp",
        securityGroups: [bastion_group.id],
        fromPort: 22,
        toPort: 22
    }],
    egress: [{
        protocol: "-1",
        cidrBlocks: ["127.0.0.1/32"],
        fromPort: 0,
        toPort: 0,
    }], // No backsies on the web_group!
    vpcId: vpc.id,
    tags: {
        Name: "sg_appserver"
    },
});

// SecurityGroup is before app_group because of circular reference
const world_to_web = new aws.ec2.SecurityGroupRule("world-to-web", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 443,
    toPort: 443,
    cidrBlocks: ["0.0.0.0/0"],
    securityGroupId: web_group.id,
});

const app_to_web = new aws.ec2.SecurityGroupRule("app-to-web", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 80,
    toPort: 80,
    securityGroupId: web_group.id,
    sourceSecurityGroupId: app_group.id,
});

const bastion_to_web = new aws.ec2.SecurityGroupRule("bastion-to-web", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 22,
    toPort: 22,
    securityGroupId: web_group.id,
    sourceSecurityGroupId: bastion_group.id,
});

const userData = 
`#!/bin/bash
sudo yum update -y
sudo yum install -y httpd24
sudo yum install -y curl`;

const webserver = new aws.ec2.Instance("webserver", {
    instanceType: size,
    ami: ami.id,
    userData: userData,
    vpcSecurityGroupIds: [web_group.id],
    subnetId: web_subnet.id,
    keyName: "ca_central_key",
    associatePublicIpAddress: true,
});

const appserver = new aws.ec2.Instance("appserver", {
    instanceType: size,
    ami: ami.id,
    userData: userData,
    vpcSecurityGroupIds: [app_group.id],
    subnetId: app_subnet.id,
    keyName: "ca_central_key",
});

const bastion = new aws.ec2.Instance("bastion", {
    instanceType: size,
    ami: ami.id,
    vpcSecurityGroupIds: [bastion_group.id],
    subnetId: bastion_subnet.id,
    keyName: "ca_central_key",
    associatePublicIpAddress: true,
});

export const WebserverPublicIp = webserver.publicIp;
export const BastionPublicIp = bastion.publicIp;
export const WebserverPrivateIp = webserver.privateIp;
export const AppserverPrivateIp = appserver.privateIp;