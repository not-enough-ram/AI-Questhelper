#!/bin/bash
echo "Cleaning database..."
rm -f quest-mcp-server/data/quest.db
echo "Database cleaned. Will be recreated on next server start."