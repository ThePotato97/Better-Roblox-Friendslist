import { Paper } from "@mui/material";
import React, { Component } from "react";

interface FriendsListProps {
	children: React.ReactNode;
}

export const FriendsList = (props: FriendsListProps) => {
	return (
		<Paper
			sx={{
				height: "80vh",
				overflow: "auto",
			}}
		>
			{props.children}
		</Paper>
	);
};
