import React, {useEffect, useState } from "react";
import axios from 'axios';

function InteractionDataTable() {
    const [interactionData, setInteractionData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("http://127.0.0.1:5000/filtered_metadata")
            .then(response => {
                const { data } = response;
                const parsedData = {
                    columns: data.columns,
                    rows: data.data
                };
                setInteractionData(parsedData);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching table", error);
                setLoading(false);
            });
    }, []);

      if (loading) {
        return <p>Loading data...</p>;
          }

          return (
            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        {interactionData.columns.map((col, index) => (
                            <th key={index}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {interactionData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
}



export default InteractionDataTable