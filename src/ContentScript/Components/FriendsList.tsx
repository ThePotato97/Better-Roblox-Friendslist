import { Paper } from "@mui/material";
import React, { Component } from "react";

interface FriendsListProps {
  children: React.ReactNode;
}

export const FriendsListContainer = (props: FriendsListProps) => {
  return (
    <Paper
      sx={{
        height: "100%",
        overflow: "auto",
      }}
    >
      {props.children}
    </Paper>
  );
};
