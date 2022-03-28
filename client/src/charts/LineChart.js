import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const LineChart = ({ chartData }) => {
    return (
        <div>
            <div style={{width: '70vw', margin: 'auto'}}>
                <Line 
                    data={chartData}
                />
            </div>
            
        </div>
    )
}

export default LineChart;